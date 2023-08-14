---
layout: post
title:  Docker教程07:Docker中安装Redis实例
category: Docker
tags: docker 教程 redis
keywords: docker 教程 container 容器 redis
description: Docker教程07:docker 快速安装redis的实例教程
date: 2018-12-26T13:19:55+08:00
---

## 1. Docker安装Redis方法一:docker pull redis:3.2

查找Docker Hub上的redis镜像

```bash
root@mojotv:~/redis$ docker search  redis
NAME                      DESCRIPTION                   STARS  OFFICIAL  AUTOMATED
redis                     Redis is an open source ...   2321   [OK]       
sameersbn/redis                                         32                   [OK]
torusware/speedus-redis   Always updated official ...   29             [OK]
bitnami/redis             Bitnami Redis Docker Image    22                   [OK]
anapsix/redis             11MB Redis server image ...   6                    [OK]
webhippie/redis           Docker images for redis       4                    [OK]
clue/redis-benchmark      A minimal docker image t...   3                    [OK]
williamyeh/redis          Redis image for Docker        3                    [OK]
unblibraries/redis        Leverages phusion/baseim...   2                    [OK]
greytip/redis             redis 3.0.3                   1                    [OK]
servivum/redis            Redis Docker Image            1                    [OK]
...
```

这里我们拉取官方的镜像,标签为3.2

```bash
root@mojotv:~/redis$ docker pull  redis:3.2
```

等待下载完成后,我们就可以在本地镜像列表里查到REPOSITORY为redis,标签为3.2的镜像.

```bash
root@mojotv:~/redis$ docker images redis 
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
redis               3.2                 43c923d57784        2 weeks ago         193.9 MB
```

## 2. Docker安装Redis方法二:通过 dockerfile 构建

### 首先,创建目录redis/data,用于存放后面的相关东西.

```bash
root@mojotv:~$ mkdir -p ~/redis ~/redis/data
```

data目录将映射为redis容器配置的/data目录,作为redis数据持久化的存储目录

### 进入创建的redis目录,创建`dockerfile`文件

```yaml
FROM debian:jessie

# add our user and group first to make sure their IDs get assigned consistently, regardless of whatever dependencies get added
RUN groupadd -r redis && useradd -r -g redis redis

RUN apt-get update && apt-get install -y --no-install-recommends \
                ca-certificates \
                wget \
        && rm -rf /var/lib/apt/lists/*

# grab gosu for easy step-down from root
ENV GOSU_VERSION 1.7
RUN set -x \
        && wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$(dpkg --print-architecture)" \
        && wget -O /usr/local/bin/gosu.asc "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$(dpkg --print-architecture).asc" \
        && export GNUPGHOME="$(mktemp -d)" \
        && gpg --keyserver ha.pool.sks-keyservers.net --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4 \
        && gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu \
        && rm -r "$GNUPGHOME" /usr/local/bin/gosu.asc \
        && chmod +x /usr/local/bin/gosu \
        && gosu nobody true

ENV REDIS_VERSION 3.2.0
ENV REDIS_DOWNLOAD_URL http://download.redis.io/releases/redis-3.2.0.tar.gz
ENV REDIS_DOWNLOAD_SHA1 0c1820931094369c8cc19fc1be62f598bc5961ca

# for redis-sentinel see: http://redis.io/topics/sentinel
RUN buildDeps='gcc libc6-dev make' \
        && set -x \
        && apt-get update && apt-get install -y $buildDeps --no-install-recommends \
        && rm -rf /var/lib/apt/lists/* \
        && wget -O redis.tar.gz "$REDIS_DOWNLOAD_URL" \
        && echo "$REDIS_DOWNLOAD_SHA1 *redis.tar.gz" | sha1sum -c - \
        && mkdir -p /usr/src/redis \
        && tar -xzf redis.tar.gz -C /usr/src/redis --strip-components=1 \
        && rm redis.tar.gz \
        && make -C /usr/src/redis \
        && make -C /usr/src/redis install \
        && rm -r /usr/src/redis \
        && apt-get purge -y --auto-remove $buildDeps

RUN mkdir /data && chown redis:redis /data
VOLUME /data
WORKDIR /data

COPY docker-entrypoint.sh /usr/local/bin/
ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 6379
CMD [ "redis-server" ]
```

### 通过dockerfile创建一个镜像,替换成您自己的名字

```bash
root@mojotv:~/redis$ docker build  -t redis:3.2 .
```

### 创建完成后,我们可以在本地的镜像列表里查找到刚刚创建的镜像

```bash

root@mojotv:~/redis$ docker images redis 
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
redis               3.2                 43c923d57784        2 weeks ago         193.9 MB

```

## 3. 使用redis镜像

### 运行容器

```bash

root@mojotv:~/redis$ docker run -p 6379:6379 -v $PWD/data:/data  -d redis:3.2 redis-server --appendonly yes
43f7a65ec7f8bd64eb1c5d82bc4fb60e5eb31915979c4e7821759aac3b62f330
root@mojotv:~/redis$
```

### 命令说明：

- `-p 6379:6379` : 将容器的6379端口映射到主机的6379端口
- `-v $PWD/data:/data` : 将主机中当前目录下的data挂载到容器的/data
- `redis-server --appendonly yes` : 在容器执行redis-server启动命令,并打开redis持久化配置

### 查看容器启动情况

```bash

root@mojotv:~/redis$ docker ps
CONTAINER ID   IMAGE        COMMAND                 ...   PORTS                      NAMES
43f7a65ec7f8   redis:3.2    "docker-entrypoint.sh"  ...   0.0.0.0:6379->6379/tcp     agitated_cray
```

## 连接,查看容器

使用redis镜像执行redis-cli命令连接到刚启动的容器,主机IP为172.17.0.1

```bash
root@mojotv:~/redis$ docker exec -it 43f7a65ec7f8 redis-cli
172.17.0.1:6379> info
# Server
redis_version:3.2.0
redis_git_sha1:00000000
redis_git_dirty:0
redis_build_id:f449541256e7d446
redis_mode:standalone
os:Linux 4.2.0-16-generic x86_64
arch_bits:64
multiplexing_api:epoll
...
```