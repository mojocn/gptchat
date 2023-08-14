---
layout: post
title: TCP/UDP/SOCKET in Python
category: Python
tags: Python
keywords: python
description: socket 网络通讯
date: 2018-12-26T13:19:54+08:00
---

### 网络通信协议TCP UDP SOCKET

- `IP`：网络层协议;
- `TCP`和`UDP`：传输层协议;
- `HTTP`：应用层协议;
- `SOCKET`：`TCP`/`IP`网络的`API`.
- `TCP`/`IP`代表传输控制协议/网际协议,指的是一系列协议.
- `TCP`和`UDP`使用`IP`协议从一个网络传送数据包到另一个网络.把`IP`想像成一种高速公路,它允许其它协议在上面行驶并找到到其它电脑的出口.`TCP`和`UDP`
  是高速公路上的“卡车”,它们携带的货物就是像`HTTP`,文件传输协议`FTP`这样的协议等.
- `TCP`和`UDP`是`FTP`,`HTTP`和`SMTP`之类使用的传输层协议.虽然`TCP`和`UDP`都是用来传输其他协议的,它们却有一个显著的不同：TCP提供有保证的数据传输,而`UDP`不提供.这意味着`TCP`
  有一个特殊的机制来确保数据安全的不出错的从一个端点传到另一个端点,而`UDP`不提供任何这样的保证.
- `HTTP`(超文本传输协议)是利用`TCP`在两台电脑(通常是`Web`服务器和客户端)之间传输信息的协议.客户端使用Web浏览器发起`HTTP`请求给`Web`服务器,`Web`服务器发送被请求的信息给客户端.
  记住,需要IP协议来连接网络;`TCP`是一种允许我们安全传输数据的机制,,使用`TCP`协议来传输数据的`HTTP`是`Web`服务器和客户端使用的特殊协议.
- `Socke`t 接口是`TCP`/`IP`网络的`API`,`Socket`接口定义了许多函数或例程,用以开发`TCP`/`IP`网络上的应用程序.

### 何谓socket

计算机,顾名思义即是用来做计算.因而也需要输入和输出,输入需要计算的条件,输出计算结果.这些输入输出可以抽象为I/O（input output）.

Unix的计算机处理IO是通过文件的抽象.计算机不同的进程之间也有输入输出,也就是通信.因此这这个通信也是通过文件的抽象文件描述符来进行.

在同一台计算机,进程之间可以这样通信,如果是不同的计算机呢？网络上不同的计算机,也可以通信,那么就得使用网络套接字（socket）.socket就是在不同计算机之间进行通信的一个抽象.他工作于TCP/IP协议中应用层和传输层之间的一个抽象.如下图：

![](/assets/image/socket_python_01.jpg)

### 服务器通信

socket保证了不同计算机之间的通信,也就是网络通信.对于网站,通信模型是客户端服务器之间的通信.两个端都建立一个socket对象,然后通过socket对象对数据进行传输.通常服务器处于一个无线循环,等待客户端连接：

![](/assets/image/socket_python_02.jpg)

### socket 通信实例

socket接口是操作系统提供的,调用操作系统的接口.当然高级语言一般也封装了好用的函数接口,下面用python代码写一个简单的socket服务端例子：

server.py

```python
    import socket

    HOST = 'localhost'      # 服务器主机地址
    PORT = 5000             # 服务器监听端口
    BUFFER_SIZE = 2048      # 读取数据大小

    # 创建一个套接字
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)  
    # 绑定主机和端口
    sock.bind((HOST, PORT))
    # 开启socket监听
    sock.listen(5)

    print 'Server start, listening {}'.format(PORT)

    while True:
        # 建立连接,连接为建立的时候阻塞
        conn, addr = sock.accept()
        while True:
            # 读取数据,数据还没到来阻塞
            data = conn.recv(BUFFER_SIZE)
            if len(data):
                print 'Server Recv Data: {}'.format(data)
                conn.send(data)
                print 'Server Send Data: {}'.format(data)
            else:
                print 'Server Recv Over'
                break
        conn.close()
    sock.close()
```

client.py

```python
    import socket

    HOST = 'localhost'
    PORT = 5000
    BUFFER_SIZE = 1024

    # 创建客户端套接字
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    # 连接到服务器
    sock.connect((HOST, PORT))

    try:
        message = "Hello"
        # 发起数据给服务器
        sock.sendall(message)
        amount_received = 0
        amount_expected = len(message)
        while amount_received < amount_expected:
            # 接收服务器返回的数据
            data = sock.recv(10)
            amount_received += len(data)
            print 'Client Received: {}'.format(data)

    except socket.errno, e:
        print 'Socket error: {}'.format(e)
    except Exception, e:
        print 'Other exception: %s'.format(e)
    finally:
        print 'Closing connection to the server'
        sock.close()
```

### TCP 三次握手

python代码写套接字很简单.传说的TCP三次握手又是如何体现的呢？什么是三次握手呢?

* 第一握：首先客户端发送一个syn,请求连接,
* 第二握：服务器收到之后确认,并发送一个 syn ack应答
* 第三握：客户端接收到服务器发来的应答之后再给服务器发送建立连接的确定.

用下面的比喻就是

> C：约么？
>
> S：约
>
> C：好的
>
> 约会

这样就建立了一个TCP连接会话.如果是要断开连接,大致过程是：

![](/assets/image/socket_python_03.jpg)

上图也很清晰的表明了三次握手的socket具体过程.

1. 客户端socket对象connect调用之后进行阻塞,此过程发送了一个syn.
2. 服务器内核完成三次握手,即发送syn和ack应答.
3. 客户端socket对象收到服务端发送的应答之后,再发送一个ack给服务器,并返回connect调用,建立连接.
4. 服务器socket对象接受客户端最后一次握手确定ack建立连接.
5. 此时服务端调用accept,则从连接队列中将之前建立的连接取出返回.

至此,客户端和服务器的socket通信连接建立完成,剩下的就是两个端的连接对象收发数据,从而完成网络通信.

文中图片来源网络

更多细节,可以阅读 [TCP握手与socket通信细节](https://www.jianshu.com/p/3f42172f582b)
