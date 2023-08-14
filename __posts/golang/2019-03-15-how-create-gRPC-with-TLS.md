---
layout: post
title: Go进阶14:私有证书+gRPC+TLS服务
category: Golang
tags: Go进阶
description: 
keywords: golang,gRPC+TLS,github.com/libragen/thanos
date: 2019-03-15T13:19:54+08:00
score: 5.0
coverage: qcmd_grpc.jpg
published: true
---

## 1.简洁

## 2.什么是SSL/TLS通信

不使用SSL/TLS的HTTP通信,就是不加密的通信.所有信息明文传播,带来了三大风险.

1. 窃听风险（eavesdropping）：第三方可以获知通信内容.
2. 篡改风险（tampering）：第三方可以修改通信内容.
3. 冒充风险（pretending）：第三方可以冒充他人身份参与通信.

SSL/TLS协议是为了解决这三大风险而设计的,希望达到：

1. 所有信息都是加密传播,第三方无法窃听.
2. 具有校验机制,一旦被篡改,通信双方会立刻发现.
3. 配备身份证书,防止身份被冒充.

互联网是开放环境,通信双方都是未知身份,这为协议的设计带来了很大的难度.而且,协议还必须能够经受所有匪夷所思的攻击,这使得SSL/TLS协议变得异常复杂.

## 3.SSL/TLS运行过程

**SSL/TLS协议的基本思路是采用公钥加密法,也就是说,客户端先向服务器端索要公钥,然后用公钥加密信息,服务器收到密文后,用自己的私钥解密.**

SSL/TLS协议的基本过程(握手阶段handshake)是这样的：

1. 客户端向服务器端索要并验证公钥.
2. 双方协商生成"对话密钥".
3. 双方采用"对话密钥"进行加密通信.

![tsl_handshake](/assets/image/tls_handshake.gif)

## 4.gRPC+TLS 私有证书试用场景

有一台master服务器需要在多带minion服务器远程执行安全级别比较高操作或者获取敏感信息,同时也不想通讯被网络中其他机器破解.

## 5.私有证书(程序自身颁发)gRPC+TLS代码实现

gRPC分布式系统的消息流程

1. master当作gRPC通讯的客户端,DB保存整个集群中minion的IP,PORT和TLS通讯的公钥,公钥和minion机器是一一对应的,不是公用的.
2. master提供minion服务器注册接口,来保存每台minion服务器的ip,port和grp TLS 公钥(每台minion的不一样)
3. minion开始运行:
    1. 调用GO标准库`crypto`生成密钥对,密钥的`[]byte`保存到minion程序的内存中
    2. minion调用master的注册接口,推送RPC TLS 的公钥,master保存这台minion的ip,port,TLS公钥等信息到数据库
    3. minion 利用刚才生成的rpc TLS 私钥证书启动 gRPC服务端
4. 第三方服务器通过调用master提供的httpAPI向指定的minion发送指令
    1. master 更具第三方接口提供的内网IP信息在数据库中找到对应的minion的IP,PORT,gRPC TLS 公有证书
    2. 利用该台minion服务器的私有证书,和gRPC的client函数来创建gRPC TLS 连接
    3. call gRPC的函数完成,远程调用

## 6 Go语言代码实现

一下代码按照第五节顺序

### 5.1 minion创建以有证书

```go
package minion

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"github.com/sirupsen/logrus"
	"math/big"
	"time"
)
//publicPemBytes 暂存私有证书的公钥
//保存公钥到内存
var publicPemBytes []byte
//生成证书密钥对
//返回*tls.Certificate 做gRPC服务器启动时的参数
func GenerateTlsCert() (*tls.Certificate, error) {
	//1.- Generate private key:
	//随机种子
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, err
	}
	// Generate a pem block with the private key
	keyPem := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(key),
	})
	//2.- Generate the certificate:
	tml := x509.Certificate{
		// you can add any attr that you need
		NotBefore: time.Now(),
		NotAfter:  time.Now().AddDate(10, 0, 0),
		// you have to generate a different serial number each execution
		SerialNumber: big.NewInt(123123),
		Subject: pkix.Name{
			CommonName:   GetHostName(),//可以自定义
			Organization: []string{"www.mojotv.com"},
		},
		BasicConstraintsValid: true,
	}
	cert, err := x509.CreateCertificate(rand.Reader, &tml, &tml, &key.PublicKey, key)
	if err != nil {
		return nil, err
	}
	// Generate a pem block with the certificate
	certPemBlock := &pem.Block{
		Type:  "CERTIFICATE",
		Bytes: cert,
	}
	publicPemBytes = pem.EncodeToMemory(certPemBlock)
	//2.1 write public.pem file
	tlsCert, err := tls.X509KeyPair(publicPemBytes, keyPem)
	return &tlsCert, err
}
//获取类型中的公钥, minion调用master提供的registerPOST时来构造jsong参数
func getMinionSSLPublicCertificate() string {
	if len(publicPemBytes) == 0 {
		logrus.Fatal("minion's SSL/TLS certificate has not generated, please make sure being called GenerateTlsCert first")
	}
	return string(publicPemBytes)
}
```

### 5.2 minion调用master提供的HTPP接口来注册自己的信息和证书

```go
package minion

import (
	"errors"
	"fmt"
	"github.com/shirou/gopsutil/cpu"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"io/ioutil"
	"net"
	"os"
	"os/exec"
	"github.com/libragen/felix/master/models"
	"github.com/libragen/felix/util"
	"strings"
)


















































//提供master的注册接口来注册自己
func RegisterWithPublicCert() error {
	url := "http://" + viper.GetString("minion.master_addr") + "/minion/register"
	machine := models.Machine{
		HostName:    GetHostName(),
		Ip:          getPublicIp(),
		Pem:         getMinionSSLPublicCertificate(),
		Status:      "online",
		IntranetIp:  getIntranetIp(),
		Brand:       getMinionVendor(),
		ProductName: getProductName(),
		CPU:         getMinionCPU(),
		OsVersion:   getCentosVersion(),
		Port:        getMinionRpcPort(),
	}
	resp, err := util.PostHttp(url, machine)
	if err != nil {
		return err
	}
	if resp.StatusCode != 200 {
		b, _ := ioutil.ReadAll(resp.Body)
		defer resp.Body.Close()
		return errors.New(string(b))
	}
	return nil
}

func GetHostName() string {
	host, err := os.Hostname()
	if err != nil {
		logrus.WithError(err).Error("getting minion hostname failed")
	}
	return strings.TrimSpace(host)
}

func getIntranetIp() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		logrus.WithError(err).Fatal("can't get minion's IP interface")
	}
	for _, address := range addrs {
		// 检查ip地址判断是否回环地址
		if ipnet, ok := address.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return ""
}

func getMinionCPU() string {
	cpus, err := cpu.Info()
	if err != nil {
		logrus.WithError(err).Error("找不到CUP信息")
		return ""
	}
	for _, cpu := range cpus {
		return fmt.Sprint(cpu.ModelName, cpu.VendorID, " Core ", cpu.Family)
	}
	return ""
}

func getMinionVendor() string {
	b, err := exec.Command("cat", "/sys/devices/virtual/dmi/id/sys_vendor").CombinedOutput()
	if err != nil {
		logrus.WithError(err).Error("不能获取系统制造上信息")
		return ""
	}
	return strings.TrimSpace(string(b))
}

func getProductName() string {
	b, err := exec.Command("cat", "/sys/devices/virtual/dmi/id/product_name").CombinedOutput()
	if err != nil {
		logrus.WithError(err).Error("不能获取linux服务器产品名称")
		return ""
	}
	return strings.TrimSpace(string(b))
}

func getCentosVersion() string {
	b, err := exec.Command("cat", "/etc/redhat-release").CombinedOutput()
	if err != nil {
		logrus.WithError(err).Error("不能获取centOS服务器版本")
		return ""
	}
	return strings.TrimSpace(string(b))
}

func getMinionRpcPort() string {
	ipPort := strings.Split(viper.GetString("minion.addr"), ":")
	return ipPort[len(ipPort)-1]
}

func getPublicIp() string {
	conn, err := net.Dial("udp", "223.6.6.6:80")
	defer conn.Close()

	if err != nil {
		return ""
	}
	return strings.Split(conn.LocalAddr().String(), ":")[0]
}

```

### 5.3 minion启动gRPC服务端

`github.com/libragen/thanos/minion/pb`使用proto工具生成,[gRPC golang 教程](https://www.jianshu.com/p/64cfec110542)

```go
package minion

import (
	"context"
	"crypto/tls"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"io/ioutil"
	"net"
	"github.com/libragen/thanos/minion/pb"
	"github.com/libragen/thanos/util"
	"strings"
)

// server is used to implement helloworld.GreeterServer.
type server struct {
}
//执行远程shell
// SayHello implements helloworld.GreeterServer
func (s *server) RunCmd(ctx context.Context, in *pb.CmdObj) (res *pb.CmdResult, err error) {
	res = &pb.CmdResult{Id: in.Id}
	var lines []byte
	if in.CmdType == pb.CmdObj_LINE {
		lines, err = util.RunCmd(in.Timeout, in.Command)

	} else {
		lines, err = util.RunExecutable(in.Timeout, in.FileName, in.FileBytes, in.Command)
	}
	if err != nil {
		return nil, err
	}
	res.Logs = string(lines)
	if err != nil {
		res.ResultType = pb.CmdResult_FAILED
	} else {
		res.ResultType = pb.CmdResult_SUCCESS
	}
	go sendCommandLogsToCallbackUrl(in, res)
	return res, err
}

//发送回调日志到第三方API
func sendCommandLogsToCallbackUrl(in *pb.CmdObj, res *pb.CmdResult) {
	if !strings.HasPrefix(in.CallbackUrl, "http") {
		return
	}
	resp, err := util.PostHttp(in.CallbackUrl, res)
	if err != nil {
		logrus.WithError(err).WithField("args", in).Error("http POST logs use is failed")
		return
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		logrus.WithError(err).Error("http post read body to string failed")
	} else {
		logrus.Debug("the callback repsonse is:", string(body))
	}
}

func (s *server) HeartBeat(ctx context.Context, in *pb.Hello) (*pb.Beat, error) {
	b := pb.Beat{Ok: true, Ip: in.Ip}
	return &b, nil
}
//启动minion的gRPC服务器
func RunServer(tlsCert *tls.Certificate) {

	//注册服务器到gru
	addr := viper.GetString("minion.addr")
	lis, err := net.Listen("tcp", addr)
	if err != nil {
		logrus.WithError(err).Fatalf("failed to listen:%s", addr)
	}
	// TLS认证
	creds := credentials.NewServerTLSFromCert(tlsCert)

	// 实例化grpc Server, 并开启TLS认证
	s := grpc.NewServer(grpc.Creds(creds))

	// 注册HelloService
	pb.RegisterMinionServiceServer(s, &server{})
	s.Serve(lis)
}

```

### 5.4 master提供注册接口

gin 路由

```go
	r.POST("minion/register", handlers.MinionRegister)
```

handler的逻辑

```go
type Machine struct {
	gorm.Model
	Ip          string `gorm:"type:text(50);index" json:"ip" form:"ip" `
	IntranetIp  string `gorm:"type:text(50);index" json:"intranet_ip" form:"intranet_ip" `
	Ip6         string `gorm:"type:text(50);index" json:"ip6" form:"ip6" `
	HostName    string `gorm:"type:text(50)" json:"host_name" form:"host_name"`
	Pem         string `gorm:"type:text(2048)" json:"pem" form:"pem" `  /gRPC TLS 公钥字符串
	Status      string `gorm:"type:text(20)" json:"status" form:"status" `
	Port        string `gorm:"type:text(5)" json:"port" form:"port"`
	Brand       string `gorm:"type:text(50)" json:"brand" form:"brand"`
	ProductName string `gorm:"type:text(256)" json:"product_name" form:"product_name"`
	CPU         string `gorm:"type:text(128)" json:"cpu" form:"cpu"`
	OsVersion   string `gorm:"type:text(128)" json:"os_version" form:"os_version"`
}
```

json post 参数详解 Machine struct

```go
var mdl models.Machine
//json post 参数详解 Machine struct
	if handleError(c, c.ShouldBind(&mdl)) {
		return
	}
	//获取外网IP
	//mdl.Ip = c.ClientIP()
	if handleError(c, mdl.UpdateOrCreateHostName()) {
		return
	}
	//if handleError(c, clients.AppendRpcClientIntoPool(&mdl)) {
	//	return
	//}
	jsonData(c, mdl)
```

### 5.5 master通过minion信息gRPC远程调用minoin

#### master的路由

```go
	r.POST("api/exec", handlers.CommandExec)
```

#### gRPC远程bash

```go
package handlers

import (
	"context"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"io/ioutil"
	"github.com/libragen/thanos/master/clients"
	"github.com/libragen/thanos/master/models"
	"github.com/libragen/thanos/minion/pb"
)

type jsonParam struct {
	Ip          string `json:"ip" form:"ip"`
	Id          uint64 `json:"id" form:"id"`
	HostName    string `json:"host_name" form:"host_name"`
	Command     string `json:"command" form:"command"` //支持bash 命令
	TimeOut     uint32 `json:"time_out" form:"time_out"`
	CommandType uint   `json:"command_type" form:"command_type"`
	File        []byte `json:"file" form:"file"` //只是shell 脚本 和二进制文件
	CallbackUrl string `json:"callback_url" form:"callback_url"`
}

func CommandExec(c *gin.Context) {
	params := jsonParam{}
	//绑定json参数
	err := c.ShouldBind(&params)
	if handleError(c, err) {
		return
	}
	//get machine with pem
	machine, err := models.MachineOneBy(params.Ip, params.HostName)
	if handleError(c, err) {
		return
	}
	//call gRPC function
	inCmd := &pb.CmdObj{
		Id:          params.Id,
		Timeout:     params.TimeOut,
		Command:     params.Command,
		CmdType:     pb.CmdObj_CmdType(params.CommandType),
		CallbackUrl: params.CallbackUrl,
	}
	if fileH, err := c.FormFile("file"); err == nil {
		file, err := fileH.Open()
		if handleError(c, err) {
			return
		}
		fileBytes, err := ioutil.ReadAll(file)
		if handleError(c, err) {
			return
		}
		inCmd.FileBytes = fileBytes
		inCmd.FileName = fileH.Filename
	}
	//应该开启一个新的线程执行
	if viper.GetBool("verbose") {
		//不让minion 调用callback_url
		resp, err := callMinionRpcFuncRunCmd(machine, inCmd)
		if handleError(c, err) {
			return
		}
		jsonData(c, resp)
	} else {
		//非调试模式会更快
		go callMinionRpcFuncRunCmd(machine, inCmd)
		jsonSuccess(c)
	}
}

//use rpc connection pool to manage call minion
//this function is better but debug is not easy
func callMinionRpcFuncRunCmd(machine *models.Machine, in *pb.CmdObj) (*pb.CmdResult, error) {

	conn, err := clients.GetByIp(machine.Ip)
	if err != nil {
		return nil, err
	}
	client := pb.NewMinionServiceClient(conn)
	//调用gRPC方法
	ctx := context.Background()
	return client.RunCmd(ctx, in)
}

```

## 7.总结

### 完整代码详解[dejavuzhou/thanos](https://github.com/libragen/thanos)

