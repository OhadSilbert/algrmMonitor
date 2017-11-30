from flask import Flask
from flask import request
import psutil
import argparse
import threading
import time


TIME_INTERVAL = 1


SIMULATE_CUDA = False
if not SIMULATE_CUDA:
    from py3nvml.py3nvml import *

app = Flask(__name__, static_folder='C:\\inetpub\\wwwroot\\ohad')

lock = threading.Lock()

class History:
    def __init__(self):
        self.MAX_TIME_POINTS = 60*60*24
        self.time = list()
        self.util_history = list()
        self.mem_history = list()

    def add(self, t, util, mem):
        self.time.append(t)
        self.util_history.append(util)
        self.mem_history.append(mem)
        if len(self.time) > self.MAX_TIME_POINTS:
            self.time = self.time[1:]
            self.util_history = self.util_history[1:]
            self.mem_history = self.mem_history[1:]
        pass
    pass

devices_history = list()

def parse_args():
    parser = argparse.ArgumentParser(description='Resource Manager')
    parser.add_argument("-p", "--port", help="port of algrm_server", default=4000, type=int)
    return parser.parse_args()


def monitor_daemon():
    while True:
        time.sleep(TIME_INTERVAL)
        t = time.time()
        device_count = nvmlDeviceGetCount()
        all_utils = list()
        all_mems = list()
        for i in range(device_count):
            handle = nvmlDeviceGetHandleByIndex(i)
            util = nvmlDeviceGetUtilizationRates(handle)
            all_utils.append(util.gpu)
            all_mems.append(util.memory)
        lock.acquire()
        for i in range(device_count):
            history = devices_history[i]
            history.add(t, all_utils[i], all_mems[i])
        lock.release()
    pass


def main():
    args = parse_args()
    app.debug = False
    if not SIMULATE_CUDA:
        nvmlInit()
        for _ in range(nvmlDeviceGetCount()):
            devices_history.append(History())
        t = threading.Thread(name='monitor-daemon', target=monitor_daemon, daemon=True )
        t.start()
    app.run(port=args.port, host='0.0.0.0')


def monitor_all_gpus():
    if SIMULATE_CUDA:
        return '[{"gpuIdx":0, "gpuId":"0000:01:00.0", "gpuName":"GeForce GTX 1050", "memTotal":1711276032}, \
        {"gpuIdx":1, "gpuId":"0000:02:00.0", "gpuName":"GeForce TITAN-X", "memTotal":855638016}]'

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


def monitor_device(gpu_idx):
    if SIMULATE_CUDA:
        if gpu_idx == 0:
            mem_total = 1711276032
            mem_free = 0
            mem_used = 1711276032
            gpu_util = 72
            procs = '[{"pid":1438, "usedGpuMemory":427819008, "cmd":"python.exe"}, {"pid":1430, "usedGpuMemory":1283457024, "cmd":"win32.exe"}]'
        elif gpu_idx == 1:
            mem_total = 855638016
            mem_free = 855638016
            mem_used = 0
            gpu_util = 0
            procs = '[]'
        else:
            return ''
        return '{' + f'"memTotal":{mem_total}, "memFree":{mem_free}, "memUsed":{mem_used}, "gpuUtil":{gpu_util}, "procs":{procs}' + '}'

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
        # tx_bytes = nvmlDeviceGetPcieThroughput(handle, NVML_PCIE_UTIL_TX_BYTES)
        # rx_bytes = nvmlDeviceGetPcieThroughput(handle, NVML_PCIE_UTIL_RX_BYTES)
        ret_json = '{'
        ret_json += f'"memTotal":{mem_info.total}, "memFree":{mem_info.free}, "memUsed":{mem_info.used},'
        ret_json += f'"gpuUtil":{gpu_util},'
        ret_json += '"procs":['
        for p in procs:
            proc = psutil.Process(p.pid)
            usedGpuMemory = {None:-1}.get(p.usedGpuMemory, p.usedGpuMemory)
            cmd = proc.name()
            try:
                user_name = proc.username().replace('\\', '/')
            except:
                user_name = 'N/A'
            ret_json += '{'
            ret_json += f'"pid":{p.pid}, "usedGpuMemory":{usedGpuMemory}, "cmd":"{cmd}", "username":"{user_name}"'
            ret_json += '},'
        ret_json = ret_json[:-1] + '],'
        lock.acquire()
        history = devices_history[gpu_idx]
        ret_json += f'"graph_time":{history.time[-600:]},'
        ret_json += f'"graph_util":{history.util_history[-600:]},'
        ret_json += f'"graph_mem":{history.mem_history[-600:]}'
        lock.release()
        ret_json += '}'
        return ret_json
    except:
        return ''
    pass


@app.route('/monitor/GPUs', methods=['GET', 'POST'])
def monitor_gpus():
    gpu_idx = request.args.get('gpuIdx', default=-1, type=int)
    if gpu_idx == -1:
        return monitor_all_gpus()
    else:
        return monitor_device(gpu_idx)
    pass


@app.route('/<path:path>')
def regulat_http(path):
    return app.send_static_file( path )


if __name__ == "__main__":
    main()
