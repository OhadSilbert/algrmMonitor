from flask import Flask
from flask import request
import psutil
import argparse
import time
from collections import deque
from py3nvml.py3nvml import *
import copy
import logging
import os


log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

os.environ["CUDA_DEVICE_ORDER"]="PCI_BUS_ID"


TIME_INTERVAL = 0.5

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                                                'algrmMonitorApp'))


class HistoryObject:
    """
    This is a time point of a single gpu state at time t
    """
    def __init__(self, t, util, mem):
        self.t = t
        self.util = util
        self.mem = mem


class GPUHistoryObject(HistoryObject):
    def __init__(self, t, util, mem, rx, tx):
        super().__init__(t, util, mem)
        self.rx = rx
        self.tx = tx


class CPUHistoryObject(HistoryObject):
    def __init__(self, t, util, mem):
        super().__init__(t, util, mem)


class History:
    """
    The total history of a single gpu
    """
    def __init__(self):
        self.MAX_TIME_POINTS = round(60/TIME_INTERVAL)
        self.q = deque(maxlen=self.MAX_TIME_POINTS)
        # self.lock = threading.Lock()

    def add(self, ho):
        """
        add HistoryObject
        :param ho: A HistoryObject
        """
        # self.lock.acquire()
        self.q.append(ho)
        # self.lock.release()

    def get_from(self, ltime):
        """
        get a list of histories, from ltime to now
        :param ltime: time point to take histories from
        :return: a list of HistoryObject
        """
        ret = list()
        tmp_q = deque(maxlen=self.MAX_TIME_POINTS)

        # self.lock.acquire()
        q = copy.copy(self.q)
        # self.lock.release()
        while len(q) > 0:
            ho = q.pop()
            tmp_q.append(ho)
            if ho.t <= ltime:
                break

        while len(tmp_q) > 0:
            ho = tmp_q.pop()
            ret.append(ho)

        return ret

    pass


devices_history = list()  # list of histories for the computer cpu and  all gpus. It holds History object for each device


def parse_args():
    parser = argparse.ArgumentParser(description='Resource Manager')
    parser.add_argument("-p", "--port", help="port of algrm_server", default=4445, type=int)
    return parser.parse_args()


def monitor_daemon():
    while True:
        time.sleep(TIME_INTERVAL)
        t = time.time()
        devices_history[0].add(CPUHistoryObject(t=t,
                                                util=psutil.cpu_percent(),
                                                mem=psutil.virtual_memory().percent))

        device_count = nvmlDeviceGetCount()
        for i in range(device_count):
            handle = nvmlDeviceGetHandleByIndex(i)
            util = nvmlDeviceGetUtilizationRates(handle)
            mem_info = nvmlDeviceGetMemoryInfo(handle)
            tx_bytes = nvmlDeviceGetPcieThroughput(handle, NVML_PCIE_UTIL_TX_BYTES)
            rx_bytes = nvmlDeviceGetPcieThroughput(handle, NVML_PCIE_UTIL_RX_BYTES)
            devices_history[i + 1].add(GPUHistoryObject(t=t,
                                                    util=util.gpu,
                                                    mem=100 * mem_info.used / mem_info.total,
                                                    rx=rx_bytes / 1024 / 1024,
                                                    tx=tx_bytes / 1024 / 1024))
    pass


def main():
    args = parse_args()
    app.debug = False
    nvmlInit()
    for _ in range(nvmlDeviceGetCount() + 1):
        devices_history.append(History())
    t = threading.Thread(name='monitor-daemon', target=monitor_daemon, daemon=True)
    t.start()
    app.run(port=args.port, host='0.0.0.0', threaded=True)


def monitor_all():
    device_count = nvmlDeviceGetCount()
    ret = list()
    ret.append({"idx": -1,
                "name": "CPU",
                "ncores": psutil.cpu_count(),
                "memTotal": psutil.virtual_memory().total})
    for i in range(device_count):
        handle = nvmlDeviceGetHandleByIndex(i)
        pci_info = nvmlDeviceGetPciInfo(handle)
        mem_info = nvmlDeviceGetMemoryInfo(handle)
        temperature = nvmlDeviceGetTemperature(handle, 0)
        temperatureThreshold = nvmlDeviceGetTemperatureThreshold(handle, 0)
        ret.append({"idx": i,
                    "id": pci_info.busId.decode("utf-8"),
                    "name": nvmlDeviceGetName(handle),
                    "memTotal": mem_info.total,
                    "temperature": temperature,
                    "temperatureThreshold": temperatureThreshold})
    return f'{ret}'.replace("'", '"')


def add_gpu_history_to_json(jsn, history, ltime):
    """
    add the gpu history to the json
    :param jsn: json
    :param history: History
    :param ltime:  last time in the graph
    :return: the updated json
    """
    l = history.get_from(ltime)
    f = ["graph_time", "graph_util", "graph_mem", "graph_rx", "graph_tx"]
    for i, v in enumerate(zip(*map(lambda x: (x.t, x.util, x.mem, x.rx, x.tx), l))):
        jsn[f[i]] = list(v)
    return jsn


def add_cpu_history_to_json(jsn, history, ltime):
    """
    add the cpu history to the json
    :param jsn: json
    :param history: History
    :param ltime:  last time in the graph
    :return: the updated json
    """
    l = history.get_from(ltime)
    f = ["graph_time", "graph_util", "graph_mem"]
    for i, v in enumerate(zip(*map(lambda x: (x.t, x.util, x.mem), l))):
        jsn[f[i]] = list(v)
    return jsn


def monitor_device(idx, ltime):
    if type(idx) is not int:
        raise TypeError("gpu_idx type error")
    elif idx < -1:
        raise ValueError("gou_idx should be either -1 or non-negative")
    elif idx == -1:
        return monitor_computer(ltime)
    else:
        return monitor_gpu(idx, ltime)


def monitor_computer(ltime):
    try:
        ret = {"memTotal": psutil.virtual_memory().total,
               "memFree": psutil.virtual_memory().free,
               "memUsed": psutil.virtual_memory().percent,
               "cpuUtil": psutil.cpu_percent(),
               "coresUtil": psutil.cpu_percent(percpu=True)
              }

        ret = add_cpu_history_to_json(ret, devices_history[0], ltime)
        return f'{ret}'.replace("'", '"')
    except :
        return ''
    pass


def monitor_gpu(gpu_idx, ltime):
    try:
        handle = nvmlDeviceGetHandleByIndex(gpu_idx)
        procs = nvmlDeviceGetComputeRunningProcesses(handle)

        mem_info = nvmlDeviceGetMemoryInfo(handle)
        util = nvmlDeviceGetUtilizationRates(handle)
        gpu_util = util.gpu
        temperature = nvmlDeviceGetTemperature(handle, 0)
        temperatureThreshold = nvmlDeviceGetTemperatureThreshold(handle, 0)

        # mem_util = util.memory
        # gpu_clock = nvmlDeviceGetClockInfo(handle, NVML_CLOCK_GRAPHICS)
        # gpu_clock_max = nvmlDeviceGetMaxClockInfo(handle, NVML_CLOCK_GRAPHICS)
        # gpu_mem_clock = nvmlDeviceGetClockInfo(handle, NVML_CLOCK_MEM)
        # gpu_mem_clock_max = nvmlDeviceGetMaxClockInfo(handle, NVML_CLOCK_SM)

        procs_info = list()
        for p in procs:
            try:
                proc = psutil.Process(p.pid)
                user_name = proc.username()
                cmd = proc.name()
            except :
                # can fail if it is run on docker.
                user_name = ''
                cmd = ''
            used_gpu_memory = {None: -1}.get(p.usedGpuMemory, p.usedGpuMemory)
            procs_info.append({"pid": p.pid,
                               "usedGpuMemory": used_gpu_memory,
                               "cmd": cmd,
                               "username": user_name
                               })
            pass

        ret = {"memTotal": mem_info.total,
               "memFree": mem_info.free,
               "memUsed": mem_info.used,
               "gpuUtil": gpu_util,
               "procs": procs_info,
               "temperature": temperature,
               "temperatureThreshold": temperatureThreshold}

        ret = add_gpu_history_to_json(ret, devices_history[gpu_idx + 1], ltime)
        return f'{ret}'.replace("'", '"')
    except:
        return ''
    pass


@app.route('/monitor/Devices', methods=['GET', 'POST'])
def monitor_devices():
    idx = request.args.get('idx', default=-999, type=int)
    ltime = request.args.get('lTime', default=0, type=float)
    if idx == -999:
        return monitor_all()
    else:
        return monitor_device(idx, ltime)
    pass


@app.route('/<path:path>')
def regulat_http(path):
    return app.send_static_file( path )


if __name__ == "__main__":
    main()
