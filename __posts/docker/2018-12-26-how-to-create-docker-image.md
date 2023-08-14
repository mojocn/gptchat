---
layout: post
title: Docker教程09:创建Dockers镜像
category: Docker
tags: Docker dockerfile
keywords: 创建,docker,image,镜像,教程
date: 2018-12-26T13:19:57+08:00
description: 在构建上下文中使用的dockerfile文件,是一个构建指令文件.为了提高构建性能,可以通过.dockerignore文件排除上下文目录下,不需要的文件和目录
---

## dockerfile文件使用

`docker build`命令会根据dockerfile文件及上下文构建新Docker镜像.构建上下文是指dockerfile所在的本地路径或一个URL（Git仓库地址）.构建上下文环境会被递归处理,所以,构建所指定的路径还包括了子目录,而URL还包括了其中指定的子模块.

### 构建镜像

将当前目录做为构建上下文时,可以像下面这样使用docker build命令构建镜像：

```shell
$ ~/Downloads/hello-system$ sudo docker build .
Sending build context to Docker daemon  70.14kB

```

说明：构建会在Docker后台守护进程（daemon）中执行,而不是CLI中.构建前,构建进程会将全部内容（递归）发送到守护进程.大多情况下,应该将一个空目录作为构建上下文环境,并将dockerfile文件放在该目录下.

在构建上下文中使用的dockerfile文件,是一个构建指令文件.为了提高构建性能,可以通过.dockerignore文件排除上下文目录下,不需要的文件和目录.

dockerfile一般位于构建上下文的根目录下,也可以通过-f指定该文件的位置：

```shell
$ sudo docker build -f /home/keke/Downloads/hello-system/dockerfile .

```

构建时,还可以通过-t参数指定构建成后,镜像的仓库,标签等：

### 镜像标签

```shell
$ ~/Downloads/hello-system$ sudo docker build -t keke/myapp .

```

如果存在多个仓库下,或使用多个镜像标签,就可以使用多个-t参数：

```shell
$ docker build -t keke/myapp:1.0.2 -t keke/myapp:latest .
```

在Docker守护进程执行dockerfile中的指令前,首先会对dockerfile进行语法检查,有语法错误时会返回：

```shell
$ docker build -t test/myapp .
Sending build context to Docker daemon 2.048 kB
Error response from daemon: Unknown instruction: RUNCMD
```

## dockerfile文件格式

dockerfile文件中指令不区分大小写,但为了更易区分,约定使用大写形式.

Docker 会依次执行dockerfile中的指令,文件中的第一条指令必须是FROM,FROM指令用于指定一个基础镜像.

FROM指令用于指定其后构建新镜像所使用的基础镜像.FROM指令必是dockerfile文件中的首条命令,启动构建流程后,Docker将会基于该镜像构建新镜像,FROM后的命令也会基于这个基础镜像.

dockerfile文件格式如下：

```markdown
# Comment
INSTRUCTION arguments

```

dockerfile文件中指令不区分大小写,但为了更易区分,约定使用大写形式.

Docker 会依次执行dockerfile中的指令,文件中的第一条指令必须是FROM,FROM指令用于指定一个基础镜像.

### FROM语法格式为：

```markdown
FROM <image> 或 FROM <image>:<tag>
```

通过FROM指定的镜像,可以是任何有效的基础镜像.FROM有以下限制：

FROM必须是dockerfile中第一条非注释命令
在一个dockerfile文件中创建多个镜像时,FROM可以多次出现.只需在每个新命令FROM之前,记录提交上次的镜像ID.
tag或digest是可选的,如果不使用这两个值时,会使用latest版本的基础镜像

### RUN

RUN用于在镜像容器中执行命令,其有以下两种命令执行方式：
shell执行
在这种方式会在shell中执行命令,Linux下默认使用/bin/sh -c,Windows下使用cmd /S /C.
注意：通过SHELL命令修改RUN所使用的默认shell

```markdown
RUN <command>
```

exec执行

```markdown
RUN ["executable", "param1", "param2"]
```

RUN可以执行任何命令,然后在当前镜像上创建一个新层并提交.提交后的结果镜像将会用在dockerfile文件的下一步.

通过RUN执行多条命令时,可以通过\换行执行：

```markdown
RUN /bin/bash -c 'source $HOME/.bashrc; \
echo $HOME'
```

也可以在同一行中,通过分号分隔命令：

```markdown
RUN /bin/bash -c 'source $HOME/.bashrc; echo $HOME'

```

RUN指令创建的中间镜像会被缓存,并会在下次构建中使用.如果不想使用这些缓存镜像,可以在构建时指定--no-cache参数,如：docker build --no-cache.

### CMD

CMD用于指定在容器启动时所要执行的命令.CMD有以下三种格式：

```markdown
CMD ["executable","param1","param2"]
CMD ["param1","param2"]
CMD command param1 param2
```

CMD不同于RUN,CMD用于指定在容器启动时所要执行的命令,而RUN用于指定镜像构建时所要执行的命令.
CMD与RUN在功能实现上也有相似之处.如：

```markdown
docker run -t -i keke/static /bin/true 等价于：cmd ["/bin/true"]
```

CMD在dockerfile文件中仅可指定一次,指定多次时,会覆盖前的指令.
另外,docker run命令也会覆盖dockerfile中CMD命令.如果docker run运行容器时,使用了dockerfile中CMD相同的命令,就会覆盖dockerfile中的CMD命令.
如,我们在构建镜像的dockerfile文件中使用了如下指令：

```markdown
CMD ["/bin/bash"]
```

使用docker build构建一个新镜像,镜像名为keke/test.构建完成后,使用这个镜像运行一个新容器,运行效果如下：

```markdown
sudo docker run -i -t keke/test
```

在使用docker run运行容器时,我们并没有在命令结尾指定会在容器中执行的命令,这时Docker就会执行在dockerfile的CMD中指定的命令.
如果不想使用CMD中指定的命令,就可以在docker run命令的结尾指定所要运行的命令：

```markdown
sudo docker run -i  -t keke/test /bin/ps
```

这时,docker run结尾指定的/bin/ps命令覆盖了dockerfile的CMD中指定的命令.

### ENTRYPOINT

ENTRYPOINT用于给容器配置一个可执行程序.也就是说,每次使用镜像创建容器时,通过ENTRYPOINT指定的程序都会被设置为默认程序.ENTRYPOINT有以下两种形式：

```markdown
ENTRYPOINT ["executable", "param1", "param2"]
ENTRYPOINT command param1 param2
```

ENTRYPOINT与CMD非常类似,不同的是通过docker run执行的命令不会覆盖ENTRYPOINT,而docker
run命令中指定的任何参数,都会被当做参数再次传递给ENTRYPOINT.dockerfile中只允许有一个ENTRYPOINT命令,多指定时会覆盖前面的设置,而只执行最后的ENTRYPOINT指令.
docker run运行容器时指定的参数都会被传递给ENTRYPOINT,且会覆盖CMD命令指定的参数.如,执行docker run <image> -d时, -d参数将被传递给入口点.也可以通过docker run
--entrypoint重写ENTRYPOINT入口点.
如：可以像下面这样指定一个容器执行程序：

```markdown
ENTRYPOINT ["/usr/bin/nginx"]
```

完整构建代码：

```dockerfile
FROM ...
MAINTAINER keke "2536495681@gmail.com"
RUN ...

# 指定容器内的程序将会使用容器的指定端口
# 配合 docker run -p
EXPOSE ...

```

使用docker build构建镜像,并将镜像指定为keke/test：

```markdown
sudo docker build -t="itbilu/test" .
```

构建完成后,使用keke/test启动一个容器：

```markdown
sudo docker run -i -t keke/test -g "daemon off;"
```

在运行容器时,我们使用了-g "daemon off;" ,这个参数将会被传递给ENTRYPOINT,最终在容器中执行的命令为/usr/sbin/nginx -g "daemon off;" .

### EXPOSE

EXPOSE用于指定容器在运行时监听的端口：

```markdown
EXPOSE <port> [<port>...]
```

EXPOSE并不会让容器的端口访问到主机.要使其可访问,需要在docker run运行容器时通过-p来发布这些端口,或通过-P参数来发布EXPOSE导出的所有端口.

* RUN: 指定镜像被构建时要运行的命令
* CMD: 指定容器被启动时要运行的命令
* ENTRYPOINT: 同 CMD ,但不会被 docker run -t 覆盖
* WORKDIR: CMD/ENTRYPOINT 会在这个目录下执行
* VOLUME:创建挂载点,即向基于所构建镜像创始的容器添加卷
* ADD:用于复制构建环境中的文件或目录到镜像中
* COPY:同样用于复制构建环境中的文件或目录到镜像中

```shell
docker history images-name
```

## 从新镜像启动容器

```shell
docker run -d -p 4000:80 --name [name] #可以在 Dokcer 宿主机上指定一个具体的端口映射到容器的80端口上
```

## 守护容器

```shell
docker run -d container-name #创建守护容器
docker top container-name #查看容器内进程
docker exec container-name touch a.txt #在容器内部运行进程
docker stop container-name #停止容器
```  

## 学习资源

- Docker中文网站：http://www.docker.org.cn
- Docker中文文档：http://www.dockerinfo.net/document
- Docker安装手册：http://www.docker.org.cn/book/install.html
- 一小时Docker教程 ：https://blog.csphere.cn/archives/22
- Docker中文指南：http://www.widuu.com/chinese_docker/index.html

