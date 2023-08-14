---
layout: post
title:  Docker教程04:容器使用
category: Docker
tags: docker 教程 
keywords: docker 教程 container 容器
date: 2018-12-26T13:19:54+08:00
description: Docker教程04:容器使用,掌握这些docker命令之后,您就可以快乐的运行和管理的自己docker应用了.怎么运行/停止/重启.删除docker容器,删除docker镜像,管理docker容器端口的简明教程
---

## Docker 客户端使用帮助

使用Docker命令查看全部的帮助

```bash
[mojotv]# docker
Usage:	docker [OPTIONS] COMMAND
A self-sufficient runtime for containers
Options:
      --config string      Location of client config files (default "/home/mojotv.cn/.docker")
  -D, --debug              Enable debug mode
  -H, --host list          Daemon socket(s) to connect to
  -l, --log-level string   Set the logging level ("debug"|"info"|"warn"|"error"|"fatal") (default "info")
      --tls                Use TLS; implied by --tlsverify
      --tlscacert string   Trust certs signed only by this CA (default "/home/mojotv.cn/.docker/ca.pem")
      --tlscert string     Path to TLS certificate file (default "/home/mojotv.cn/.docker/cert.pem")
      --tlskey string      Path to TLS key file (default "/home/mojotv.cn/.docker/key.pem")
      --tlsverify          Use TLS and verify the remote
  -v, --version            Print version information and quit

Management Commands:
  config      Manage Docker configs
  container   Manage containers
  image       Manage images
  network     Manage networks
  node        Manage Swarm nodes
  plugin      Manage plugins
  secret      Manage Docker secrets
  service     Manage services
  stack       Manage Docker stacks
  swarm       Manage Swarm
  system      Manage Docker
  trust       Manage trust on Docker images
  volume      Manage volumes

Commands:
  attach      Attach local standard input, output, and error streams to a running container
  build       Build an image from a dockerfile
  commit      Create a new image from a container's changes
  cp          Copy files/folders between a container and the local filesystem
  create      Create a new container
  deploy      Deploy a new stack or update an existing stack
  diff        Inspect changes to files or directories on a container's filesystem
  events      Get real time events from the server
  exec        Run a command in a running container
  export      Export a container's filesystem as a tar archive
  history     Show the history of an image
  images      List images
  import      Import the contents from a tarball to create a filesystem image
  info        Display system-wide information
  inspect     Return low-level information on Docker objects
  kill        Kill one or more running containers
  load        Load an image from a tar archive or STDIN
  login       Log in to a Docker registry
  logout      Log out from a Docker registry
  logs        Fetch the logs of a container
  pause       Pause all processes within one or more containers
  port        List port mappings or a specific mapping for the container
  ps          List containers
  pull        Pull an image or a repository from a registry
  push        Push an image or a repository to a registry
  rename      Rename a container
  restart     Restart one or more containers
  rm          Remove one or more containers
  rmi         Remove one or more images
  run         Run a command in a new container
  save        Save one or more images to a tar archive (streamed to STDOUT by default)
  search      Search the Docker Hub for images
  start       Start one or more stopped containers
  stats       Display a live stream of container(s) resource usage statistics
  stop        Stop one or more running containers
  tag         Create a tag TARGET_IMAGE that refers to SOURCE_IMAGE
  top         Display the running processes of a container
  unpause     Unpause all processes within one or more containers
  update      Update configuration of one or more containers
  version     Show the Docker version information
  wait        Block until one or more containers stop, then print their exit codes

Run 'docker COMMAND --help' for more information on a command.
```

可以通过命令 docker command --help 更深入的了解指定的 Docker 命令使用方法.

例如我们要查看 docker stats 指令的具体使用方法：`docker stats --help`

## Docker容器使用

### 1. Docker拉取一个镜像: `docker pull`

拉取一个名为training/webapp的容器镜像

```bash
[mojotv]# docker pull training/webapp
Using default tag: latest
latest: Pulling from training/webapp
e190868d63f8: Pull complete 
909cd34c6fd7: Pull complete 
0b9bfabab7c1: Pull complete 
a3ed95caeb02: Pull complete 
10bbbc0fc0ff: Pull complete 
fca59b508e9f: Pull complete 
e7ae2541b15b: Pull complete 
9dd97ef58ce9: Pull complete 
a4c1b0cb7af7: Pull complete 
Digest: sha256:06e9c1983bd6d5db5fba376ccd63bfa529e8d02f23d5079b8f74a616308fb11d
Status: Downloaded newer image for training/webapp:latest   
```

### 2. Docker 运行镜像: `docker run`

```bash
[mojotv]# docker run -d -P training/webapp python app.py
3d480467047002de142d4b461c66186406714f8e5859f6ebf1fd789ebe64fe84
```

参数说明:

- `-d` :让容器在后台运行.
- `-P` :将容器内部使用的网络端口映射到我们使用的主机上.

### 3.Docker查看全部运行的容器: `docker ps`

`docker ps -l` 查询最后一次创建的容器：

```bash
[root@mojotv]# docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS                PORTS                     NAMES
9ed725c123a8        training/webapp     "python app.py"          18 minutes ago      Up 50 seconds         0.0.0.0:5000->5000/tcp    reverent_swirles
3d4804670470        training/webapp     "python app.py"          31 minutes ago      Up 30 minutes         0.0.0.0:32772->5000/tcp   agitated_stonebraker
eafeafb7eeea        minio/minio         "/usr/bin/docker-ent…"   6 days ago          Up 6 days (healthy)   0.0.0.0:80->9000/tcp      minio_80
[root@mojotv]# docker ps -l
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS                    NAMES
9ed725c123a8        training/webapp     "python app.py"     19 minutes ago      Up 53 seconds       0.0.0.0:5000->5000/tcp   reverent_swirles

```

#### Docker容器5000端口映射到服务外网IP;32772端口上,可以使用IP:32772访问Python Flask Web应用

```bash
0.0.0.0:32772->5000/tcp
```

#### 可以通过`docker run -p `参数来设置不一样的端口：

`docker run -d -p 5000:5000 training/webapp python app.py` docker容器内部5000端口映射到外网5000端口
这样Python Flask Web 应用就可以用过 IP:5000访问了

```bash
[root@mojotv]# docker run -d -p 5000:5000 training/webapp python app.py
9ed725c123a80cbbf1518c6b4d2949fb3c3643fbb018572b78b130fbc7ba68fd
[root@mojotv]# docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS                PORTS                     NAMES
9ed725c123a8        training/webapp     "python app.py"          4 seconds ago       Up 3 seconds          0.0.0.0:5000->5000/tcp    reverent_swirles
3d4804670470        training/webapp     "python app.py"          12 minutes ago      Up 12 minutes         0.0.0.0:32772->5000/tcp   agitated_stonebraker
eafeafb7eeea        minio/minio         "/usr/bin/docker-ent…"   6 days ago          Up 6 days (healthy)   0.0.0.0:80->9000/tcp      minio_80
[root@mojotv]# 
```

### 4.查看Docker容器网络端口的快捷方式:` docker port`

通过 `docker ps` 命令可以查看到容器的端口映射.docker 还提供了另一个快捷方式 `docker port`.

**使用 `docker port` 可以查看指定 （ID 或者名字）容器的某个确定端口映射到宿主机的端口号**

上面我们创建的 web 应用容器 ID 为 `9ed725c123a8` 名字为 `reverent_swirles`

```bash
[root@mojotv]# docker port 9ed725c123a8
5000/tcp -> 0.0.0.0:5000
[root@mojotv]# docker port reverent_swirles
5000/tcp -> 0.0.0.0:5000
```

### 5.查看Docker容器应用的日志: `docker logs`

`docker logs [ID或者名字]` 可以查看容器内部的标准输出.

`-f`: 让 `docker logs` 像使用 `tail -f` 一样来输出容器内部的标准输出.

```bash
[root@mojotv]# docker logs -f  reverent_swirles
 * Running on http://0.0.0.0:5000/ (Press CTRL+C to quit)

[root@mojotv]# docker logs -f  9ed725c123a8
 * Running on http://0.0.0.0:5000/ (Press CTRL+C to quit)
10.254.88.189 - - [04/Dec/2018 06:30:40] "GET / HTTP/1.1" 200 -
10.254.88.189 - - [04/Dec/2018 06:30:40] "GET /favicon.ico HTTP/1.1" 404 -
```

我们可以看到应用程序使用的是 5000 端口并且能够查看到应用程序的访问日志.

### 6.查看Docker容器应用的进程 :`docker top`

`docker top` 来查看容器内部运行的进程

```bash
UID                 PID                 PPID                C                   STIME               TTY                 TIME                CMD
root                32252               32233               0                   14:21               ?                   00:00:00            python app.py
```

### 7.查看Docker容器底层信息:`docker inspect`

使用 docker inspect 来查看 Docker 的底层信息.它会返回一个 JSON 文件记录着 Docker 容器的配置和状态信息.

```bash
[root@mojotv]# docker inspect  9ed725c123a8
[
    {
        "Id": "9ed725c123a80cbbf1518c6b4d2949fb3c3643fbb018572b78b130fbc7ba68fd",
        "Created": "2018-12-04T06:21:28.750420866Z",
...   
```

### 7.停止Docker应用容器: `docker stop`

```bash
[root@mojotv]# docker stop  9ed725c123a8
9ed725c123a8
```

### 8.启动Docker应用容器: `docker start`

```bash
[root@mojotv]# docker start  9ed725c123a8
9ed725c123a8
```

### 9.移除应用容器: `docker rm`

我们可以使用 docker rm 命令来删除不需要的容器

删除容器时,容器必须是停止状态,否则会报如下错误

```bash
[root@mojotv]# docker stop  9ed725c123a8
9ed725c123a8
[root@mojotv]# docker rm  9ed725c123a8
9ed725c123a8

```

### 11.Docker 查看全部的镜像: `docker images ls`

```bash
[root@mojotv]# docker image ls
REPOSITORY          TAG                            IMAGE ID            CREATED             SIZE
minio/minio         RELEASE.2018-11-22T02-51-56Z   4c8e74d7646d        12 days ago         36.5MB
minio/minio         latest                         97ccfc64e768        6 weeks ago         36MB
training/webapp     latest                         6fae60ef3446        3 years ago         349MB
```

### 12.Docker 删除镜像: `dockers rmi`

删除image之前必须先使用`docker stop`停止容器,必要的时候需要带上强制参数`-f`

```bash
[root@mojotv]# docker rmi training/webapp -f 
Untagged: training/webapp:latest
Untagged: training/webapp@sha256:06e9c1983bd6d5db5fba376ccd63bfa529e8d02f23d5079b8f74a616308fb11d
Deleted: sha256:6fae60ef344644649a39240b94d73b8ba9c67f898ede85cf8e947a887b3e6557
[root@mojotv]# 
```

### 总结

掌握这些命令您就可以快乐的跑自己的docker 容器程序了!!!