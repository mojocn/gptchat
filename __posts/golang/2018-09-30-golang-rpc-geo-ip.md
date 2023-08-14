---
layout: post
title: golang解析IP到城市jsonRPC
category: Golang
tags: golang RPC
description: golang geoIP RPC
date: 2018-12-26T13:19:54+08:00
---

## RESTful接口

**请求URL：**

- `/ip2addr?ip=219.140.227.235`

**请求方式：**

- GET

**参数：**

| 参数名 | 类型               | 说明                         |
|:----|:-----------------|----------------------------|
| ip  | url-qurey-string | `可选` 要查询的ip地址,如果不传这表示当前的ip |

**返回示例**

``` go
{
    "code": 1,
    "data": {
        "Country": "中国",
        "Province": "湖北省",
        "City": "武汉",
        "ISP": "",
        "Latitude": 30.5801,
        "Longitude": 114.2734,
        "TimeZone": "Asia/Shanghai"
    },
    "ip": "219.140.227.235"
}
```

> json_rpc `tcp` 地址: `121.40.238.123`(IP地址更快) `api.xxx.com`  端口: `3344`


***

## 第三方资源

* [GeoIP2 Reader for Go](https://github.com/oschwald/geoip2-golang)
* [GeoLite2 开源数据库](https://dev.maxmind.com/zh-hans/geoip/geoip2/geolite2-%E5%BC%80%E6%BA%90%E6%95%B0%E6%8D%AE%E5%BA%93/)

## go标准库jsonRPC服务端

> Go官方提供了一个RPC库: net/rpc.包rpc提供了通过网络访问一个对象的方法的能力.服务器需要注册对象,
> 通过对象的类型名暴露这个服务.注册后这个对象的输出方法就可以远程调用,这个库封装了底层传输的细节,包括序列化.服务器可以注册多个不同类型的对象,但是注册相同类型的多个对象的时候回出错.
> * 方法的类型是可输出的 (the method's type is exported)
> * 方法本身也是可输出的 （the method is exported）
> * 方法必须由两个参数,必须是输出类型或者是内建类型 (the method has two arguments, both exported or builtin types)
> * 方法的第二个参数是指针类型 (the method's second argument is a pointer)
> * 方法返回类型为 error (the method has return type error)

```go
package main

import (
	"fmt"
	"github.com/oschwald/geoip2-golang"
	"net"
	"net/rpc"
	"net/rpc/jsonrpc"
	"os"
	"log"
)
//返回值结构体
//需要满足以上要求
type Response struct {
	Country   string
	Province  string
	City      string
	ISP       string
	Latitude  float64
	Longitude float64
	TimeZone  string
}

type Ip2addr struct {
	db *geoip2.Reader
}
//参数结构体
//需要满足以上要求
type Agrs struct {
	IpString string
}
//json rpc 处理请求
//需要满足以上要求
func (t *Ip2addr) Address(agr *Agrs, res *Response) error {
	netIp := net.ParseIP(agr.IpString)
        //调用开源geoIp 数据库查询ip地址
	record, err := t.db.City(netIp)
	res.City = record.City.Names["zh-CN"]
	res.Province = record.Subdivisions[0].Names["zh-CN"]
	res.Country = record.Country.Names["zh-CN"]
	res.Latitude = record.Location.Latitude
	res.Longitude = record.Location.Longitude
	res.TimeZone = record.Location.TimeZone
	return err
}

func main() {
         //加载geoIp数据库
	db, err := geoip2.Open("./GeoLite2-City.mmdb")
	if err != nil {
		log.Fatal(err)
	}
        //初始化jsonRPC
	ip2addr := &Ip2addr{db}
       //注册
	rpc.Register(ip2addr)
       //绑定端口
	address := ":3344"
	tcpAddr, err := net.ResolveTCPAddr("tcp", address)
	checkError(err)
	listener, err := net.ListenTCP("tcp", tcpAddr)
	checkError(err)
	log.Println("json rpc is listening",tcpAddr)
	for {
		conn, err := listener.Accept()
		if err != nil {
			continue
		}
		jsonrpc.ServeConn(conn)
	}

}

func checkError(err error) {
	if err != nil {
		fmt.Println("Fatal error ", err.Error())
		os.Exit(1)
	}
}

```

## PHP-jsonRPC客户端

```go


class JsonRPC
{
    public $conn;

    function __construct($host, $port)
    {
        $this->conn = fsockopen($host, $port, $errno, $errstr, 3);
        if (!$this->conn) {
            return false;
        }
    }

    public function Call($method, $params)
    {
        $obj = new stdClass();
        $obj->code = 0;

        if (!$this->conn) {
            $obj->info = "jsonRPC连接失败!请联系";
            return $obj;
        }
        $err = fwrite($this->conn, json_encode(array(
                'method' => $method,
                'params' => array($params),
                'id' => 0,
            )) . "\n");
        if ($err === false) {
            fclose($this->conn);
            $obj->info = "jsonRPC发送参数失败!请检查自己的rpc-client代码";
            return $obj;
        }

        stream_set_timeout($this->conn, 0, 3000);
        $line = fgets($this->conn);
        fclose($this->conn);
        if ($line === false) {
            $obj->info = "jsonRPC返回消息为空!请检查自己的rpc-client代码";
            return $obj;
        }
        $temp = json_decode($line);
        $obj->code = $temp->error == null ? 1 : 0;
        $obj->data = $temp->result;
        return $obj;
    }
}


function json_rpc_ip_address($ipString)
{
    $client = new JsonRPC("127.0.0.1", 3344);
    $obj = $client->Call("Ip2addr.Address", ['IpString' => $ipString]);
    return $obj;
}
```

## go语言jsonRPC客户端

```go
package main

import (
	"fmt"
	"log"
	"net/rpc/jsonrpc"
)

type Response struct {
	Country   string
	Province  string
	City      string
	ISP       string
	Latitude  float64
	Longitude float64
	TimeZone  string
}
type Agrs struct {
	IpString string
}
func main() {
	client, err := jsonrpc.Dial("tcp", "121.40.238.123:3344")
	if err != nil {
		log.Fatal("dialing:", err)
	}
	// Synchronous call
	var res Response
	err = client.Call("Ip2addr.Address", Agrs{"219.140.227.235"}, &res)
	if err != nil {
		log.Fatal("ip2addr error:", err)
	}
	fmt.Println(res)

}
```

## [代码地址](https://github.com/mojocn/ip2location/tree/master/example)

## [欢迎pr/star golang-captcha](https://github.com/mojocn/base64Captcha)