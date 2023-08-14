---
layout: post
title: 在树莓派上安装kali linux黑客系统
category: Misc
tags: kali linux 树莓派 raspberryPi
description: 低成本的配置一台黑客使用的kali linux电脑
keywords: 黑客,树莓派,raspberryPi,kali,linux
score: 5.0
coverage: golang_signal.jpg
published: true
---

## 出发点

- 数字公司配置配置电脑是windows10,还有一堆监控软件和各种花样端口屏蔽,安全防护软件,内部VPN,导致使用虚拟机装kaliLinux总是联网失败.
- 自己的macbook沦落为看片VCD,虚拟机跑起来很吃力
- **经济危机手头紧**,智能想出这个最低成本的配置一台黑客主机的

## 方案

-
    1. 淘宝:树莓派3代B+型 Raspberry Pi 3B+电源+外壳(270RMB)
-
    2. 金士顿64GTF卡(59.9RMB)
-
    3. HDMI转VGA
-
    4. 废弃的27英寸LCD显示器
-
    5. 闲置鼠标键盘

**总共破费 329.9 RMB**

## 安装部署

### 1. 下载镜像

-
    1. `https://www.offensive-security.com/kali-linux-arm-images/`
-
    2. 展开网页`RaspberryPi Foundation`
-
    3. 选择[`Kali Linux RaspberryPi 2 and 3`](https://images.offensive-security.com/arm-images/kali-linux-2018.4-rpi3-nexmon.img.xz)

### 2. 制作镜像

下载完会发现后缀是 .img.xz (网上教程说需要7zip解压出img文件,我试过了会出错,Windows下可使用[Win32 Disk Imager](https://sourceforge.net/projects/win32diskimager/)直接写入不必解压)
,直接双击打开,选择TF卡—>Start Restoring 等待完成
4.拔出内存卡,插入树莓派,开机

第一次开机建议使用HDMI连接显示器
连接键盘鼠标
添加WIFI连接,添加后后期会自动连接
第一次开机初始化时注意屏幕右上角是否有黄色闪电符号

5.开机（默认用户名root密码toor）在图形化界面连接wifi

6.拓展分区（网上教程上使用raspi-config拓展分区,试过后发现并不能拓展）
<1>安装vim

    apt update && apt install vim -y

<2>修改源文件为清华源（为了速度,删除自带的官方源）

```shell
vim /etc/apt/sources.list
deb http://mirrors.tuna.tsinghua.edu.cn/kali kali-rolling main contrib non-free
```
 