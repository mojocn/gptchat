---
layout: post
title:  Docker教程02:Docker安装
category: Docker
tags: docker 教程
keywords: docker 教程
date: 2018-12-26T13:19:54+08:00
description: Docker在不同平台(MacOS,Linux,Centos,Windows等操作系统)上的安装教程,支持yum安装,脚本安装 brew cask 安装,修改docker镜像地址.
---

## 介绍

Docker 是一个开源的商业产品,有两个版本：社区版（Community Edition,缩写为 CE）和企业版（Enterprise Edition,缩写为 EE）.

企业版包含了一些收费服务,个人开发者一般用不到.下面的介绍都针对社区版.

## Windows Docker 安装

win7,win8 等需要利用 docker toolbox 来安装,国内可以使用[阿里云镜像](http://mirrors.aliyun.com/docker-toolbox/windows/docker-toolbox/)

docker toolbox 是一个工具集,它主要包含以下一些内容：

- Docker CLI 客户端,用来运行docker引擎创建镜像和容器
- Docker Machine. 可以让您在windows的命令行中运行docker引擎命令
- Docker Compose. 用来运行docker-compose命令
- Kitematic. 这是Docker的GUI版本
- Docker QuickStart shell. 这是一个已经配置好Docker的命令行环境
- Oracle VM Virtualbox. 虚拟机

### 下载完成之后直接点击安装,安装成功后,桌边会出现三个图标

![docker-windwos-install-three-app](/assets/image/docker_windows_install01.png)

### 点击 Docker QuickStart 图标来启动 Docker Toolbox 终端.

如果系统显示 User Account Control 窗口来运行 VirtualBox 修改您的电脑,选择 Yes.

![docker-windwos-install-three-app](/assets/image/docker_windows_install02.png)

### 出现`$`符号您可以输入命令

```shell
$ docker run hello-world
 Unable to find image 'hello-world:latest' locally
 Pulling repository hello-world
 91c95931e552: Download complete
 a8219747be10: Download complete
 Status: Downloaded newer image for hello-world:latest
....
```

## Windows10 Docker 安装

### 现在 Docker 有专门的 Win10 专业版系统的安装包,需要开启Hyper-V.

[开启Hyper-V教程](https://docs.microsoft.com/zh-cn/virtualization/hyper-v-on-windows/quick-start/enable-hyper-v)

### 安装 Toolbox

最新版 Toolbox 下载地址： [https://www.docker.com/get-docker](https://www.docker.com/get-docker)

点击 Get Docker Community Edition,并下载 Windows 的版本：

![](/assets/image/docker_windows_install03.jpg)
![](/assets/image/docker_windows_install04.jpg)

**双击下载的 Docker for Windows Installe 安装文件,一路 Next,点击 Finish 完成安装**

- 安装完成后,Docker 会自动启动.通知栏上会出现个小鲸鱼的图标,这表示 Docker 正在运行.

- 我们可以在命令行执行 docker version 来查看版本号,docker run hello-world 来载入测试镜像测试.

## 镜像加速

鉴于国内网络问题,后续拉取 Docker 镜像十分缓慢,我们可以需要配置加速器来解决,我使用的是网易的镜像地址：http://hub-mirror.c.163.com.

新版的 Docker 使用 `/etc/docker/daemon.json（Linux）` 或者 `%programdata%\docker\config\daemon.json`（Windows） 来配置 Daemon.

请在该配置文件中加入（没有该文件的话,请先建一个）：

```javascript
{
  "registry-mirrors": ["http://hub-mirror.c.163.com"]
}
```

## CentOS Docker 安装

### Docker支持以下的CentOS版本：

- CentOS 7 (64-bit)
- CentOS 6.5 (64-bit) 或更高的版本

### 前提条件

目前,CentOS 仅发行版本中的内核支持 Docker.

Docker 运行在 CentOS 7 上,要求系统为64位,系统内核版本为 3.10 以上.

Docker 运行在 CentOS-6.5 或更高的版本的 CentOS 上,要求系统为64位,系统内核版本为 2.6.32-431 或者更高版本.

### yum安装Docker

从 2017 年 3 月开始 docker 在原来的基础上分为两个分支版本: Docker CE 和 Docker EE.Docker CE 即社区免费版,Docker EE 即企业版,强调安全,但需付费使用.
本文介绍 Docker CE 的安装使用.

```javascript
$ sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-selinux \
                  docker-engine-selinux \
                  docker-engine
```

安装一些必要的系统工具：

```javascript
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
```

添加软件源信息：

`sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo`

更新 yum 缓存：

`sudo yum makecache fast`

安装 Docker-ce：

`sudo yum -y install docker-ce`

启动 Docker 后台服务

`sudo systemctl start docker`

测试运行 `hello-world`

```shell
[root@mojotv]# docker run hello-world
```

移除旧的版本：

## Centos脚本安装Docker

1. 使用 `sudo` 或 `root` 权限登录 Centos.
2. 确保 yum 包更新到最新.`$ sudo yum update`
3. 执行 Docker 安装脚本.
    ```shell
    $ curl -fsSL https://get.docker.com -o get-docker.sh
    $ sudo sh get-docker.sh
    ```
   执行这个脚本会添加 docker.repo 源并安装 Docker.
4. 启动 Docker 进程.`sudo systemctl start docker`
5. 验证`docker`是否安装成功并在容器中执行一个测试的镜像.`$ sudo docker run hello-world`
6. 查看Docker进程`docker ps`

到此,Docker 在 CentOS 系统的安装完成.

## MacOS Docker 安装

### 使用Homebrew安装

MacOS 我们可以使用 Homebrew 来安装 Docker.[Homebrew安装教程](https://brew.sh/index_zh-cn)
Homebrew 的 Cask 已经支持 Docker for Mac,因此可以很方便的使用 Homebrew Cask 来进行安装：

```shell
brew cask install docker
```

在载入 Docker app 后,点击 Next,可能会询问您的 macOS 登陆密码,您输入即可.之后会弹出一个 Docker 运行的提示窗口,状态栏上也有有个小鲸鱼的图标.

### 手动下载安装

如果需要手动下载,请点击以下链接下载 [Stable](https://download.docker.com/mac/stable/Docker.dmg) 或 [Edge](https://download.docker.com/mac/edge/Docker.dmg) 版本的 Docker for Mac.

![mac os install docker dmg](/assets/image/docker_windows_install05.png)

- 从应用中找到 Docker 图标并点击运行.可能会询问 macOS 的登陆密码,输入即可.
- 点击顶部状态栏中的鲸鱼图标会弹出操作菜单.
- 第一次点击图标,可能会看到这个安装成功的界面,点击 "Got it!" 可以关闭这个窗口.

### 启动终端后,通过命令可以检查安装后的 Docker 版本.

```shell
$ docker --version
Docker version 17.09.1-ce, build 19e2cf6
```

### 镜像加速

鉴于国内网络问题,后续拉取 Docker 镜像十分缓慢,我们可以需要配置加速器来解决,我使用的是网易的镜像地址：`http://hub-mirror.c.163.com`.

在任务栏点击 Docker for mac 应用图标 -> Perferences... -> Daemon -> Registry mirrors.在列表中填写加速器地址即可.修改完成之后,点击 Apply & Restart 按钮,Docker 就会重启并应用配置的镜像地址了.

如同 macOS 其它软件一样,安装也非常简单,双击下载的 .dmg 文件,然后将鲸鱼图标拖拽到 Application 文件夹即可.

![mac os install docker dmg](/assets/image/docker_windows_install05.png)

### docker info 来查看是否配置成功

```shell
$ docker info
...
Registry Mirrors:
 http://hub-mirror.c.163.com
Live Restore Enabled: false
```

## [其他系统Docker安装](https://docs.docker.com/install/)

- [docker安装:Mac](https://docs.docker.com/docker-for-mac/install/)
- [docker安装:Windows](https://docs.docker.com/docker-for-windows/install/)
- [docker安装:Ubuntu](https://docs.docker.com/install/linux/docker-ce/ubuntu/)
- [docker安装:Debian](https://docs.docker.com/install/linux/docker-ce/debian/)
- [docker安装:Centos](https://docs.docker.com/install/linux/docker-ce/centos/)
- [docker安装:Fedora](https://docs.docker.com/install/linux/docker-ce/fedora/)
- [docker安装:Other Linux](https://docs.docker.com/install/linux/docker-ce/binaries/)
