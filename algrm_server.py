from flask import Flask
from flask import request
from bisect import bisect
import psutil
import argparse
import threading
import time


TIME_INTERVAL = 0.5


from py3nvml.py3nvml import *

app = Flask(__name__, static_folder='C:\\algrmMonitor\\')

lock = threading.Lock()

class History:
    def __init__(self):
        self.MAX_TIME_POINTS = round(60/TIME_INTERVAL)
        self.time = list()
        self.util_history = list()
        self.mem_history = list()
        self.rx_history = list()
        self.tx_history = list()

    def add(self, t, util, mem, rx, tx):
        self.time.append(t)
        self.util_history.append(util)
        self.mem_history.append(mem)
        self.rx_history.append(rx)
        self.tx_history.append(tx)
        if len(self.time) > self.MAX_TIME_POINTS:
            self.time = self.time[1:]
            self.util_history = self.util_history[1:]
            self.mem_history = self.mem_history[1:]
            self.rx_history = self.rx_history[1:]
            self.tx_history = self.tx_history[1:]
        pass

    def get_sublist(self, arr, ltime):
        idx = bisect(self.time, ltime)
        return arr[idx:]

    def get_time(self, ltime):
        return self.get_sublist(self.time, ltime)

    def get_util_history(self, ltime):
        return self.get_sublist(self.util_history, ltime)

    def get_mem_history(self, ltime):
        return self.get_sublist(self.mem_history, ltime)

    def get_rx_history(self, ltime):
        return self.get_sublist(self.rx_history, ltime)

    def get_tx_history(self, ltime):
        return self.get_sublist(self.tx_history, ltime)
    pass

devices_history = list()

def parse_args():
    parser = argparse.ArgumentParser(description='Resource Manager')
    parser.add_argument("-p", "--port", help="port of algrm_server", default=4040, type=int)
    return parser.parse_args()


def monitor_daemon():
    while True:
        time.sleep(TIME_INTERVAL)
        t = time.time()
        device_count = nvmlDeviceGetCount()
        all_utils = list()
        all_mems = list()
        all_rxs = list()
        all_txs = list()
        for i in range(device_count):
            handle = nvmlDeviceGetHandleByIndex(i)
            util = nvmlDeviceGetUtilizationRates(handle)
            mem_info = nvmlDeviceGetMemoryInfo(handle)
            tx_bytes = nvmlDeviceGetPcieThroughput(handle, NVML_PCIE_UTIL_TX_BYTES)
            rx_bytes = nvmlDeviceGetPcieThroughput(handle, NVML_PCIE_UTIL_RX_BYTES)
            all_utils.append(util.gpu)
            all_mems.append(100*mem_info.used/mem_info.total)
            all_rxs.append(rx_bytes / 1024 / 1024)
            all_txs.append(tx_bytes / 1024 / 1024)
            
        lock.acquire()
        for i in range(device_count):
            history = devices_history[i]
            history.add(t, all_utils[i], all_mems[i], all_rxs[i], all_txs[i])
        lock.release()
        
    pass


def main():
    args = parse_args()
    app.debug = False
    nvmlInit()
    for _ in range(nvmlDeviceGetCount()):
        devices_history.append(History())
    t = threading.Thread(name='monitor-daemon', target=monitor_daemon, daemon=True )
    t.start()
    app.run(port=args.port, host='0.0.0.0')


def monitor_all_gpus():
    deviceCount = nvmlDeviceGetCount()
    ret_json = '['
    for i in range(deviceCount):
        ret_json += '{'
        handle = nvmlDeviceGetHandleByIndex(i)
        pciInfo = nvmlDeviceGetPciInfo(handle)
        gpu_id = pciInfo.busId.decode("utf-8")
        gpu_name = nvmlDeviceGetName(handle)
        mem_info = nvmlDeviceGetMemoryInfo(handle)
        ret_json += f'"gpuIdx":{i}, "gpuId":"{gpu_id}", "gpuName":"{gpu_name}", "memTotal":{mem_info.total}'
        ret_json += '},'
    ret_json = ret_json[:-1] + ']'
    return ret_json


def monitor_device(gpu_idx, ltime):
    try:
        handle = nvmlDeviceGetHandleByIndex(gpu_idx)
        procs = nvmlDeviceGetComputeRunningProcesses(handle)

        mem_info = nvmlDeviceGetMemoryInfo(handle)
        util = nvmlDeviceGetUtilizationRates(handle)
        gpu_util = util.gpu
        mem_util = util.memory
        # temp = nvmlDeviceGetTemperature(handle, NVML_TEMPERATURE_GPU)
        # gpu_clock = nvmlDeviceGetClockInfo(handle, NVML_CLOCK_GRAPHICS)
        # gpu_clock_max = nvmlDeviceGetMaxClockInfo(handle, NVML_CLOCK_GRAPHICS)
        # gpu_mem_clock = nvmlDeviceGetClockInfo(handle, NVML_CLOCK_MEM)
        # gpu_mem_clock_max = nvmlDeviceGetMaxClockInfo(handle, NVML_CLOCK_SM)
        ret_json = '{'
        ret_json += f'"memTotal":{mem_info.total}, "memFree":{mem_info.free}, "memUsed":{mem_info.used},'
        ret_json += f'"gpuUtil":{gpu_util},'
        ret_json += '"procs":['

        for p in procs:
            proc = psutil.Process(p.pid)
            usedGpuMemory = {None:-1}.get(p.usedGpuMemory, p.usedGpuMemory)
            cmd = proc.name()
            tensorboard_port = -1
            try:
                user_name = proc.username()
                for q in psutil.process_iter(attrs=["name", "username", "cmdline"]):
                    try:
                        if user_name == q.username() and "tensorboard" in q.name():
                            tensorboard_port = 6006
                            for i, w in enumerate(q.cmdline()):
                                if "port" in w:
                                    tensorboard_port = int(q.cmdline()[i + 1])
                                    break
                    except:
                        continue

                user_name = user_name.replace('\\', '/')
            except:
                user_name = 'N/A'
                tensorboard_port = -1
            ret_json += '{'
            ret_json += f'"pid":{p.pid}, "usedGpuMemory":{usedGpuMemory}, "cmd":"{cmd}", "username":"{user_name}", "tensorboard":{tensorboard_port}'
            ret_json += '},'
        if ret_json[-1] == ',':
            ret_json = ret_json[:-1] + '],'
        else:
            ret_json += '],'
        lock.acquire()
        history = devices_history[gpu_idx]
        ret_json += f'"graph_time":{history.get_time(ltime)},'
        ret_json += f'"graph_util":{history.get_util_history(ltime)},'
        ret_json += f'"graph_mem":{history.get_mem_history(ltime)},'
        ret_json += f'"graph_rx":{history.get_rx_history(ltime)},'
        ret_json += f'"graph_tx":{history.get_tx_history(ltime)}'
        lock.release()
        ret_json += '}'
        return ret_json
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
