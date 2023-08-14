---
layout: post
title: Docker实践01:安装自己的FS(网盘)
category: Docker
tags: OSS
keywords: filestorage,fs,minio,S3,OSS
date: 2018-12-27T13:19:54+08:00
description: Minio是一个云原生的应用程序,旨在在多租户环境中以可持续的方式进行扩展.Orchestration平台为Minio的扩展提供了非常好的支撑.以下是各种orchestration平台的Minio部署文档.
---

## 背景

现在很多网盘云服务都是收费,每年阿里云/腾讯云...都有很大的促销力度,云服务器也不是很贵.
Minio是一个云原生的应用程序,旨在在多租户环境中以可持续的方式进行扩展.Orchestration平台为Minio的扩展提供了非常好的支撑.以下是各种orchestration平台的Minio部署文档.

### Feature

- 安装简单:golang编译好的二级制文件,直接运行,也可以支持docker安装
- 兼容s3协议,通知有很多管理工具
- 多平台安装

## 安装教程

### Docker 安装

稳定版

```shell
docker pull minio/minio
docker run -p 9000:9000 --name minio1 \
  -e "MINIO_ACCESS_KEY=您的登陆key" \
  -e "MINIO_SECRET_KEY=您的密钥" \
  -v /mnt/data:/data \
  -v /mnt/config:/root/.minio \
  minio/minio server /data
```

犀利版

```shell
docker pull minio/minio:edge
docker run -p 9000:9000 --name minio1 \
  -e "MINIO_ACCESS_KEY=您的登陆key" \
  -e "MINIO_SECRET_KEY=您的密钥" \
  -v /mnt/data:/data \
  -v /mnt/config:/root/.minio \
  minio/minio server /data
```

### linux平台安装

[下载二进制文件minio](https://dl.minio.io/server/minio/release/linux-amd64/minio)安装

```shell
wget https://dl.minio.io/server/minio/release/linux-amd64/minio
chmod +x minio
./minio server /data
```

### macOS平台安装

使用`Homebrew`安装

```shell
brew install minio/stable/minio
minio server /data
```

[下载二进制文件minio](https://dl.minio.io/server/minio/release/darwin-amd64/minio)安装

```shell
chmod 755 minio
./minio server /data
```

### windows平台安装

[下载二进制文件minio](https://dl.minio.io/server/minio/release/windows-amd64/minio.exe)安装

```shell
minio.exe server D:\Photos
```

## minio server 命令参数详解

### 设置fs储存目录`/home/shared`

`$ minio server /home/shared`

### 制定服务端口IP`192.168.1.101:9000`

`$ minio server --address 192.168.1.101:9000 /home/shared`

### 设置域名shell域名变量

`$ export MINIO_DOMAIN=mydomain.com`

`$ minio server --address mydomain.com:9000 /mnt/export`

### 设置配置文件夹`/home/.minio`

`$ minio server --address 192.168.1.101:9000 /home/shared -C /home/.minio`

## 我的内网服务器运行效果

### 登陆界面

![minio_login_page](/assets/image/minio_login.png)

### 文件管理界面

![minio_hoem](/assets/image/minio_home.png)

## Minio相关教程

- [Docker教程:Docker安装](/2018/11/08/how-to-install-docker)
- [Github-mino]()
- [官方文档](https://docs.minio.io/cn/)
- [Minio：一个开源的AWS S3服务器,让您老爷安卓机焕发第二春](https://studygolang.com/articles/10272)