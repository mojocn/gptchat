---
layout: post
title:  Docker教程06:镜像管理和创建
category: Docker
tags: docker 教程 dockerfile
keywords: docker,教程,container,镜像,image,管理,创建
date: 2018-12-26T13:19:54+08:00
description: Docker教程06:docker image tag 镜像管理和创建,更新.docker镜像仓库中下载的镜像不能满足我们的需求时,我们可以通过以下两种方式对镜像进行更改,从已经创建的容器中更新镜像,并且提交这个镜像,使用 dockerfile 指令来创建一个新的镜像
---

## 摘要

当运行容器时,使用的镜像如果在本地中不存在,docker 就会自动从 docker 镜像仓库中下载,默认是从 Docker Hub 公共镜像源下载.下面我们来学习：

1. 管理和使用本地 Docker 主机镜像
   2 .创建镜像

## 1. 列出镜像列表; `docker images`

```bash
[root@mojotv]# docker images
REPOSITORY          TAG                            IMAGE ID            CREATED             SIZE
minio/minio         RELEASE.2018-11-22T02-51-56Z   4c8e74d7646d        12 days ago         36.5MB
minio/minio         latest                         97ccfc64e768        6 weeks ago         36MB
training/webapp     latest                         6fae60ef3446        3 years ago         349MB
[root@mojotv]# docker images --help

Usage:	docker images [OPTIONS] [REPOSITORY[:TAG]]

List images

Options:
  -a, --all             Show all images (default hides intermediate images)
      --digests         Show digests
  -f, --filter filter   Filter output based on conditions provided
      --format string   Pretty-print images using a Go template
      --no-trunc        Don't truncate output
  -q, --quiet           Only show numeric IDs
[root@mojotv]# ^C

```

### 项参数说明

- `-a` : 全部的镜像
- `-f` : 过滤
- `-q` : 只显示ID
- `REPOSITORY`：表示镜像的仓库源
- `TAG`：镜像的标签
- `IMAGE ID`：镜像ID
- `CREATED`：镜像创建时间
- `SIZE`：镜像大小

### `REPOSITORY:TAG` 来定义不同版本的镜像

同一仓库源可以有多个 TAG,代表这个仓库源的不同个版本,如ubuntu仓库源里,有15.10,14.04等多个不同的版本,我们使用 `REPOSITORY:TAG` 来定义不同的镜像.
所以,我们如果要使用版本为15.10的ubuntu系统镜像来运行容器时,命令如下：

```bash
root@mojotv:~$ docker run -t -i ubuntu:15.10 /bin/bash 
root@d77ccb2e5cca:/#
```

## 2. 查找镜像

我们可以从 Docker Hub 网站来搜索镜像,[Docker Hub]( https://hub.docker.com/) 网址为： https://hub.docker.com
我们也可以使用 docker search 命令来搜索镜像.比如我们需要一个httpd的镜像来作为我们的web服务.我们可以通过 docker search 命令搜索 httpd 来寻找适合我们的镜像.

```bash
[root@mojotv]# docker search httpd
NAME                                    DESCRIPTION                                     STARS               OFFICIAL            AUTOMATED
httpd                                   The Apache HTTP Server Project                  2204                [OK]                
hypriot/rpi-busybox-httpd               Raspberry Pi compatible Docker Image with a …   45                                      
....
```

表格说明

- NAME:镜像仓库源的名称
- DESCRIPTION:镜像的描述
- OFFICIAL:是否docker官方发布

## 3. 获取镜像: `docker pull`

```bash
[root@mojotv]# docker pull httpd
Using default tag: latest
latest: Pulling from library/httpd
a5a6f2f73cd8: Pulling fs layer 
ac13924397e3: Pulling fs layer 
91b81769f14a: Pulling fs layer 
fec7170426de: Waiting 
992c7790d5f3: Waiting 
```

## 4. 运行镜像

```bash
root@mojotv:~$ docker run httpd
```

## 5. 更新镜像

### 1. 获取一个ubbuntu 15.10的镜像

```bash
[root@mojotv]# docker pull ubuntu:15.10
15.10: Pulling from library/ubuntu
7dcf5a444392: Pull complete 
759aa75f3cee: Pull complete 
3fa871dc8a2b: Pull complete 
224c42ae46e7: Pull complete 
Digest: sha256:02521a2d079595241c6793b2044f02eecf294034f31d6e235ac4b2b54ffc41f3
Status: Downloaded newer image for ubuntu:15.10
```

### 2. 运行ubuntu:15.10 容器并且兼容容器的bash命令行

```bash
[root@mojotv]# docker run -t -i ubuntu:15.10 /bin/bash
```

在ubuntu容器的命令行中运行升级命令

```bash
root@5ca6dd2b6a6b:/# apt-get update
Ign http://archive.ubuntu.com wily InRelease
Ign http://archive.ubuntu.com wily-updates InRelease
Ign http://archive.ubuntu.com wily-security InRelease
```

注意到此时容器的ID:`5ca6dd2b6a6b`,在完成操作之后,输入 exit命令来退出这个容器.

### 3. 运行docker的commit命令提交容器的更新

```bash
[root@mojotv]# docker commit -m="awesome update" -a="mojotv.cn" 5ca6dd2b6a6b mojotv/ubuntu:v2
sha256:e9bd2efc0662044981385ddaa05930482694e3fbd41ed9b1dc6405e93627f839
```

各个参数说明：

- `-m`:提交的描述信息
- `-a`:指定镜像作者
- `e218edb10161`：容器ID

mojotv/ubuntu:v2:指定要创建的目标镜像名

### 4. 查看镜像列表

执行`docker images -a`出现了mojotv/ubuntu的镜像

```bash
[root@mojotv]# docker images -a
REPOSITORY          TAG                            IMAGE ID            CREATED             SIZE
mojotv/ubuntu       v2                             e9bd2efc0662        7 minutes ago       137MB
minio/minio         RELEASE.2018-11-22T02-51-56Z   4c8e74d7646d        12 days ago         36.5MB
httpd               latest                         2a51bb06dc8b        2 weeks ago         132MB
minio/minio         latest                         97ccfc64e768        6 weeks ago         36MB
ubuntu              15.10                          9b9cb95443b5        2 years ago         137MB
training/webapp     latest                         6fae60ef3446        3 years ago         349MB
```

使用我们的新镜像 mojotv/ubuntu 来启动一个容器

```bash
root@mojotv:~$ docker run -t -i mojotv/ubuntu:v2 /bin/bash                            
root@1a9fbdeb5da3:/#
```

## 6. 构建镜像

我们使用命令 `docker build` , 从零开始来创建一个新的镜像.为此,我们需要创建一个 `dockerfile 文件,其中包含一组指令来告诉 Docker 如何构建我们的镜像.

```bash
root@mojotv:~$ cat dockerfile 
FROM    centos:6.7
MAINTAINER      Fisher "fisher@sudops.com"

RUN     /bin/echo 'root:123456' |chpasswd
RUN     useradd mojotv
RUN     /bin/echo 'mojotv:123456' |chpasswd
RUN     /bin/echo -e "LANG=\"en_US.UTF-8\"" >/etc/default/local
EXPOSE  22
EXPOSE  80
CMD     /usr/sbin/sshd -D
```

每一个指令都会在镜像上创建一个新的层,每一个指令的前缀都必须是大写的.

第一条FROM,指定使用哪个镜像源

RUN 指令告诉docker 在镜像内执行命令,安装了什么...

然后,我们使用 dockerfile 文件,通过 docker build 命令来构建一个镜像.

```bash
root@mojotv:~$ docker build -t mojotv/centos:6.7 .
Sending build context to Docker daemon 17.92 kB
Step 1 : FROM centos:6.7
 ---&gt; d95b5ca17cc3
Step 2 : MAINTAINER Fisher "fisher@sudops.com"
 ---&gt; Using cache
 ---&gt; 0c92299c6f03
Step 3 : RUN /bin/echo 'root:123456' |chpasswd
 ---&gt; Using cache
 ---&gt; 0397ce2fbd0a
Step 4 : RUN useradd mojotv
......
```

参数说明：

`-t` ：指定要创建的目标镜像名

`.` ：dockerfile 文件所在目录,可以指定dockerfile 的绝对路径

使用`docker images` 查看创建的镜像已经在列表中存在,镜像ID为860c279d2fec

```bash
root@mojotv:~$ docker images 
REPOSITORY          TAG                 IMAGE ID            CREATED              SIZE
mojotv/centos       6.7                 860c279d2fec        About a minute ago   190.6 MB
mojotv/ubuntu       v2                  70bf1840fd7c        17 hours ago         158.5 MB
ubuntu              14.04               90d5884b1ee0        6 days ago           188 MB
php                 5.6                 f40e9e0f10c8        10 days ago          444.8 MB
nginx               latest              6f8d099c3adc        12 days ago          182.7 MB
mysql               5.6                 f2e8d6c772c0        3 weeks ago          324.6 MB
httpd               latest              02ef73cf1bc0        3 weeks ago          194.4 MB
ubuntu              15.10               4e3b13c8a266        5 weeks ago          136.3 MB
hello-world         latest              690ed74de00f        6 months ago         960 B
centos              6.7                 d95b5ca17cc3        6 months ago         190.6 MB
training/webapp     latest              6fae60ef3446        12 months ago        348.8 MB
```

我们可以使用新的镜像来创建容器

```bash
root@mojotv:~$ docker run -t -i mojotv/centos:6.7  /bin/bash
[root@41c28d18b5fb /]# id mojotv
uid=500(mojotv) gid=500(mojotv) groups=500(mojotv)
```

从上面看到新镜像已经包含我们创建的用户mojotv

## 7. 设置镜像标签

我们可以使用 docker tag 命令,为镜像添加一个新的标签.

```bash
root@mojotv.cn:~$ docker tag 860c279d2fec mojotv/centos:dev

```

docker tag 镜像ID,这里是 860c279d2fec ,用户名称,镜像源名(repository name)和新的标签名(tag).

使用 `docker images` 命令可以看到,ID为`860c279d2fec`的镜像多一个标签.

```bash
root@mojotv.cn:~$ docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
mojotv/centos       6.7                 860c279d2fec        5 hours ago         190.6 MB
mojotv/centos       dev                 860c279d2fec        5 hours ago         190.6 MB
mojotv/ubuntu       v2                  70bf1840fd7c        22 hours ago        158.5 MB
ubuntu              14.04               90d5884b1ee0        6 days ago          188 MB
php                 5.6                 f40e9e0f10c8        10 days ago         444.8 MB
nginx               latest              6f8d099c3adc        13 days ago         182.7 MB
mysql               5.6                 f2e8d6c772c0        3 weeks ago         324.6 MB
httpd               latest              02ef73cf1bc0        3 weeks ago         194.4 MB
ubuntu              15.10               4e3b13c8a266        5 weeks ago         136.3 MB
hello-world         latest              690ed74de00f        6 months ago        960 B
centos              6.7                 d95b5ca17cc3        6 months ago        190.6 MB
training/webapp     latest              6fae60ef3446        12 months ago       348.8 MB
```
