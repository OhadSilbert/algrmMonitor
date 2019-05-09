# Introduction
The algrmMonitor is a light weight resource monitor. The server side is written over flask in python, and collects GPU  and CPU workload information. The information on the GPU is collected using the package py3nvml.
The client side is written in js. Historically, this was an educational project in order to learn js, and it was not intended to be a real application. However, over time, it was proven to be very usefull when trying to optimize DNN.

# Installation
After cloning run:
`python3 setup.py install`

# Run

## Server side
Run the server by executing:
`algrm_monitor -p <port>`

The server should run both on linux or windows without any problem. Better to make it a service on the machine, it will save you the time to restart it everytime.

## Client side:
from the browser go to the url: *http://computer.name:port/html/algrmMonitor.html*
 
