from setuptools import setup
import os.path
import unittest
import glob


setup(
    name='algrmMonitor',
    version="1.0.0",
    packages=['algrmMonitor', 'algrmMonitorApp'],
    url='',
    license='MIT',
    author='ohads',
    author_email='ohads@algotec.co.il',
    description='Monitor CPU and GPU usuage on the local computer',
    install_requires=[
        'flask >= 1.0.2',
        'psutil >= 5.6.2',
        'py3nvml >= 0.2.3'
    ],
    include_package_data=True,
    entry_points={
        'console_scripts': [
            'algrm_monitor=algrmMonitor:main',
        ],
    },
)
