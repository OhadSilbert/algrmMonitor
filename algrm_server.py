from flask import Flask
from flask import request
from flask_cors import CORS
import psutil
import argparse

SIMULATE_CUDA = True
if not SIMULATE_CUDA:
    from pynvml import *


app = Flask(__name__)
CORS(app)


def parse_args():
    parser = argparse.ArgumentParser(description='Resource Manager')
    parser.add_argument("-p", "--port", help="port of algrm_server", default=4000, type=int)
    return parser.parse_args()


def main():
    args = parse_args()
    app.debug = False
    if not SIMULATE_CUDA:
        nvmlInit()
    app.run(port=args.port)


@app.route('/monitor/GPUs', methods=['GET', 'POST'])
def monitor_gpus():
    if SIMULATE_CUDA:
        return '[{"gpu_i":0, "gpu_id":"0000:01:00.0", "gpu_name":"GeForce GTX 1050"}, \
        {"gpu_i":1, "gpu_id":"0000:02:00.0", "gpu_name":"GeForce TITAN-X"}]'
    deviceCount = nvmlDeviceGetCount()
    ret_json = '['
    for i in range(deviceCount):
        ret_json += '{'
        handle = nvmlDeviceGetHandleByIndex(i)
        pciInfo = nvmlDeviceGetPciInfo(handle)
        gpu_id = pciInfo.busId.decode("utf-8")
        gpu_name = nvmlDeviceGetName(handle).decode("utf-8")
        # tx_bytes = nvmlDeviceGetPcieThroughput(handle, NVML_PCIE_UTIL_TX_BYTES)
        # rx_bytes = nvmlDeviceGetPcieThroughput(handle, NVML_PCIE_UTIL_RX_BYTES)
        util = nvmlDeviceGetUtilizationRates(handle)
        gpu_util = util.gpu
        mem_util = util.memory
        temp = nvmlDeviceGetTemperature(handle, NVML_TEMPERATURE_GPU)
        gpu_clock = nvmlDeviceGetClockInfo(handle, NVML_CLOCK_GRAPHICS)
        gpu_clock_max = nvmlDeviceGetMaxClockInfo(handle, NVML_CLOCK_GRAPHICS)
        gpu_mem_clock = nvmlDeviceGetClockInfo(handle, NVML_CLOCK_MEM)
        gpu_mem_clock_max = nvmlDeviceGetMaxClockInfo(handle, NVML_CLOCK_SM)
        procs = nvmlDeviceGetComputeRunningProcesses(handle)
        ret_json += f'"gpu_i":{i}, "gpu_id":"{gpu_id}", "gpu_name":"{gpu_name}"'
        ret_json += '},'
    ret_json = ret_json[:-1] + ']'
    return ret_json


if __name__ == "__main__":
    main()
