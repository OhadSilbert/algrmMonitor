from flask import Flask
from flask import request
import psutil
import argparse
import time
from collections import deque
from py3nvml.py3nvml import *
import copy


TIME_INTERVAL = 0.5


app = Flask(__name__, static_folder='C:\\algrmMonitor\\')


class HistoryObject:
    """
    This is a time point of a single gpu state at time t
    """
    def __init__(self, t, util, mem, rx, tx):
        self.t = t
        self.util = util
        self.mem = mem
        self.rx = rx
        self.tx = tx


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


devices_history = list()  # list of histories for all gpus. It holds History object for each gpu


def parse_args():
    parser = argparse.ArgumentParser(description='Resource Manager')
    parser.add_argument("-p", "--port", help="port of algrm_server", default=4040, type=int)
    return parser.parse_args()


def monitor_daemon():
    while True:
        time.sleep(TIME_INTERVAL)
        t = time.time()
        device_count = nvmlDeviceGetCount()

        for i in range(device_count):
            handle = nvmlDeviceGetHandleByIndex(i)
            util = nvmlDeviceGetUtilizationRates(handle)
            mem_info = nvmlDeviceGetMemoryInfo(handle)
            tx_bytes = nvmlDeviceGetPcieThroughput(handle, NVML_PCIE_UTIL_TX_BYTES)
            rx_bytes = nvmlDeviceGetPcieThroughput(handle, NVML_PCIE_UTIL_RX_BYTES)
            devices_history[i].add(HistoryObject(t=t,
                                                 util=util.gpu,
                                                 mem=100 * mem_info.used / mem_info.total,
                                                 rx=rx_bytes / 1024 / 1024,
                                                 tx=tx_bytes / 1024 / 1024))
    pass


def main():
    args = parse_args()
    app.debug = False
    nvmlInit()
    for _ in range(nvmlDeviceGetCount()):
        devices_history.append(History())
    t = threading.Thread(name='monitor-daemon', target=monitor_daemon, daemon=True)
    t.start()
    app.run(port=args.port, host='0.0.0.0', threaded=True)


def monitor_all_gpus():
    device_count = nvmlDeviceGetCount()
    ret = list()
    for i in range(device_count):
        handle = nvmlDeviceGetHandleByIndex(i)
        pci_info = nvmlDeviceGetPciInfo(handle)
        mem_info = nvmlDeviceGetMemoryInfo(handle)
        ret.append({"gpuIdx": i,
                    "gpuId": pci_info.busId.decode("utf-8"),
                    "gpuName": nvmlDeviceGetName(handle),
                    "memTotal": mem_info.total})
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


def monitor_device(gpu_idx, ltime):
    try:
        handle = nvmlDeviceGetHandleByIndex(gpu_idx)
        procs = nvmlDeviceGetComputeRunningProcesses(handle)

        mem_info = nvmlDeviceGetMemoryInfo(handle)
        util = nvmlDeviceGetUtilizationRates(handle)
        gpu_util = util.gpu
        # mem_util = util.memory
        # temp = nvmlDeviceGetTemperature(handle, NVML_TEMPERATURE_GPU)
        # gpu_clock = nvmlDeviceGetClockInfo(handle, NVML_CLOCK_GRAPHICS)
        # gpu_clock_max = nvmlDeviceGetMaxClockInfo(handle, NVML_CLOCK_GRAPHICS)
        # gpu_mem_clock = nvmlDeviceGetClockInfo(handle, NVML_CLOCK_MEM)
        # gpu_mem_clock_max = nvmlDeviceGetMaxClockInfo(handle, NVML_CLOCK_SM)

        procs_info = list()
        for p in procs:
            proc = psutil.Process(p.pid)
            used_gpu_memory = {None: -1}.get(p.usedGpuMemory, p.usedGpuMemory)
            cmd = proc.name()
            tensorboard_port = -1
            try:
                user_name = proc.username()
            except:
                user_name = 'N/A'

            # try:
            #     user_name = proc.username()
            #     for q in psutil.process_iter(attrs=["name", "username", "cmdline"]):
            #         try:
            #             if user_name == q.username() and "tensorboard" in q.name():
            #                 tensorboard_port = 6006
            #                 for i, w in enumerate(q.cmdline()):
            #                     if "port" in w:
            #                         tensorboard_port = int(q.cmdline()[i + 1])
            #                         break
            #         except:
            #             continue
            #
            #     user_name = user_name.replace('\\', '/')
            # except:
            #     user_name = 'N/A'
            #     tensorboard_port = -1
            procs_info.append({"pid": p.pid,
                               "usedGpuMemory": used_gpu_memory,
                               "cmd": cmd,
                               "username": user_name,
                               "tensorboard": tensorboard_port})
            pass

        ret = {"memTotal": mem_info.total,
               "memFree": mem_info.free,
               "memUsed": mem_info.used,
               "gpuUtil": gpu_util,
               "procs": procs_info}

        ret = add_gpu_history_to_json(ret, devices_history[gpu_idx], ltime)
        return f'{ret}'.replace("'", '"')
    except:
        return ''
    pass


@app.route('/monitor/GPUs', methods=['GET', 'POST'])
def monitor_gpus():
    gpu_idx = request.args.get('gpuIdx', default=-1, type=int)
    ltime = request.args.get('lTime', default=0, type=float)
    if gpu_idx == -1:
        return monitor_all_gpus()
    else:
        return monitor_device(gpu_idx, ltime)
    pass


@app.route('/<path:path>')
def regulat_http(path):
    return app.send_static_file( path )


if __name__ == "__main__":
    main()
