---
layout: post
title: 在golang中使用proto gRPC
category: Golang
tags: golang RPC protobuf gRPC
description: golang gRPC RPC protobuf
date: 2018-12-26T13:19:54+08:00
---

# gRPC初体验

    gRPC是由Google主导开发的RPC框架,使用HTTP/2协议并用ProtoBuf作为序列化工具.其客户端提供Objective-C,Java接口,服务器侧则有Java,golang,C++等接口,从而为移动端（iOS/Androi）到服务器端通讯提供了一种解决方案. 当然在当下的环境下,这种解决方案更热门的方式是RESTFull API接口.该方式需要自己去选择编码方式,服务器架构,自己搭建框架（JSON-RPC）.gRPC官方对REST的声音是：

* 和REST一样遵循HTTP协议(明确的说是HTTP/2),但是gRPC提供了全双工流
* 和传统的REST不同的是gRPC使用了静态路径,从而提高性能
* 用一些格式化的错误码代替了HTTP的状态码更好的标示错误

至于是否要选择用gRPC.对于已经有一套方案的团队,可以参考下.如果是从头来做,可以考虑下gRPC提供的从客户端到服务器的整套解决方案,这样不用客户端去实现http的请求会话,JSON等的解析,服务器端也有现成的框架用.从15年3月到现在gRPC也发展了一年了,慢慢趋于成熟.下面我们就以gRPC的golang版本看下其在golang上面的表现.至于服务端的RPC,感觉golang标准库的RPC框架基本够用了,没必要再去用另一套方案.

# 1\. 安装protobuf

虽然gRPC也支持protobuf2.x,但是建议还是使用protobuf3.x,尽管还没有正式版本,不过golang版本基本没有什么问题,另外3.x官方支持了Objective-C,这也是我们使用gRPC的初衷：提供一个移动端到服务器的解决方案.去到[Protocol Buffers](https://link.jianshu.com?t=https://github.com/google/protobuf/releases)
下载最新版本（Version3.0.0 beta2）,然后解压到本地.本地需要已经安装好`autoconf automake libtool`.rpm系列（fedora/centos/redheat）可以用yum安装.Mac上可以用brew进行安装

    brew install autoconf automake libtool

然后执行

    ./configure --prefix=your_pb_install_path

接着

    make 
    make install
    set your_pb_install_path to your $PATH

检查是否安装完成

    protoc --version
    libprotoc 3.0.0

然后安装golang protobuf直接使用golang的get即可

    go get -u github.com/golang/protobuf/proto // golang protobuf 库
    go get -u github.com/golang/protobuf/protoc-gen-go //protoc --go_out 工具

# 2\. 安装gRPC-go

gRPC-go可以通过golang 的get命令直接安装,非常方便.

    go get google.golang.org/grpc

这里大家可能比较奇怪,为什么gRPC-go在github的地址是"[https://github.com/grpc/grpc-go](https://link.jianshu.com?t=https://github.com/grpc/grpc-go)"
,但是为什么要用“[google.golang.org/grpc](https://link.jianshu.com?t=http://google.golang.org/grpc)
”进行安装呢？应该grpc原本是google内部的项目,归属golang,就放在了[google.golang.org](https://link.jianshu.com?t=http://google.golang.org)
下面了,后来对外开放,又将其迁移到github上面了,又因为golang比较坑爹的import路径规则,所以就都没有改路径名了.

但是这样就有个问题了.要如何去管理版本呢？这个目前我还没有什么比较好的方法,希望知道的朋友一起分享下.目前想到一个方法是手动下载某个版本,然后写个脚本统一修改代码中的import里面的路径.

# 3\. 示例程序

## 3.1 protobuf

该示例源自gRPC-go的examples的helloworld.先看PB的描述：

    syntax = "proto3";

    option objc_class_prefix = "HLW";

    package helloworld;

    // The greeting service definition.
    service Greeter {
      // Sends a greeting
      rpc SayHello (HelloRequest) returns (HelloReply) {}
    }

    // The request message containing the user's name.
    message HelloRequest {
      string name = 1;
    }

    // The response message containing the greetings
    message HelloReply {
      string message = 1;
    }

这里定义了一个服务Greeter,其中有个API `SayHello`.其接受参数为`HelloRequest`类型,返回`HelloReply`类型.这里`HelloRequest`和`HelloReply`就是普通的PB定义

服务定义为：

    // The greeting service definition.
    service Greeter {
      // Sends a greeting
      rpc SayHello (HelloRequest) returns (HelloReply) {}
    }

`service`定义了一个server.其中的接口可以是四种类型

* rpc GetFeature(Point) returns (Feature) {}  
  类似普通的函数调用,客户端发送请求Point到服务器,服务器返回相应Feature.
* rpc ListFeatures(Rectangle) returns (stream Feature) {}  
  客户端发起一次请求,服务器端返回一个流式数据,比如一个数组中的逐个元素
* rpc RecordRoute(stream Point) returns (RouteSummary) {}  
  客户端发起的请求是一个流式的数据,比如数组中的逐个元素,服务器返回一个相应
* rpc RouteChat(stream RouteNote) returns (stream RouteNote) {}  
  客户端发起的请求是一个流式数据,比如数组中的逐个元素,二服务器返回的也是一个类似的数据结构

后面三种可以参考官方的[route_guide](https://link.jianshu.com?t=https://github.com/grpc/grpc-go/tree/master/examples/route_guide)示例.

使用protoc命令生成相关文件：

    protoc --go_out=plugins=grpc:. helloworld.proto
    ls
    helloworld.pb.go    helloworld.proto

生成对应的pb.go文件.这里用了plugins选项,提供对grpc的支持,否则不会生成Service的接口.

## 3.2 服务器端程序

然后编辑服务器端程序：

    package main

    import (
        "log"
        "net"

        pb "your_path_to_gen_pb_dir/helloworld"
        "golang.org/x/net/context"
        "google.golang.org/grpc"
    )

    const (
        port = ":50051"
    )

    // server is used to implement helloworld.GreeterServer.
    type server struct{}

    // SayHello implements helloworld.GreeterServer
    func (s *server) SayHello(ctx context.Context, in *pb.HelloRequest) (*pb.HelloReply, error) {
        return &pb.HelloReply{Message: "Hello " + in.Name}, nil
    }

    func main() {
        lis, err := net.Listen("tcp", port)
        if err != nil {
            log.Fatalf("failed to listen: %v", err)
        }
        s := grpc.NewServer()
        pb.RegisterGreeterServer(s, &server{})
        s.Serve(lis)
    }

这里首先定义一个server结构,然后实现SayHello的接口,其定义在“your_path_to_gen_pb_dir/helloworld”

    SayHello(context.Context, *HelloRequest) (*HelloReply, error)

然后调用`grpc.NewServer()` 创建一个server s.接着注册这个server s到结构server上面 `pb.RegisterGreeterServer(s, &server{})` 最后将创建的net.Listener传给`s.Serve()`
.就可以开始监听并服务了,类似HTTP的ListenAndServe.

## 3.3 客户端程序

客户端程序：

    package main

    import (
        "log"
        "os"

        pb "your_path_to_gen_pb_dir/helloworld"
        "golang.org/x/net/context"
        "google.golang.org/grpc"
    )

    const (
        address     = "localhost:50051"
        defaultName = "world"
    )

    func main() {
        // Set up a connection to the server.
        conn, err := grpc.Dial(address, grpc.WithInsecure())
        if err != nil {
            log.Fatalf("did not connect: %v", err)
        }
        defer conn.Close()
        c := pb.NewGreeterClient(conn)

        // Contact the server and print out its response.
        name := defaultName
        if len(os.Args) > 1 {
            name = os.Args[1]
        }
        r, err := c.SayHello(context.Background(), &pb.HelloRequest{Name: name})
        if err != nil {
            log.Fatalf("could not greet: %v", err)
        }
        log.Printf("Greeting: %s", r.Message)
    }

这里通过pb.NewGreeterClient()传入一个conn创建一个client,然后直接调用client上面对应的服务器的接口

    SayHello(context.Context, *HelloRequest) (*HelloReply, error)

接口,返回*HelloReply 对象.

先运行服务器,在运行客户端,可以看到.

    ./greeter_server &
    ./greeter_client
    2016/03/10 21:42:19 Greeting: Hello world

