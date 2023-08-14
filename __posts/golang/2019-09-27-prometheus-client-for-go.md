---
layout: post
title: "Go进阶31:Prometheus Client教程"
category: Golang
tags: Go进阶
keywords: Go语言教程,Golang教程,Prometheus Golang Client教程
description: "主要介绍把Prometheus当作时序数据库TSDB,应用到Go语言业务app中做数据统计分析,Prometheus的Client Library提供度量的四种基本类型包括:Counter,Gauge,Histogram,Summary"
coverage: prometheus_grafana.jpg
permalink: /go/:title
date: 2019-09-27T15:22:54+08:00
---

## 1. Prometheus是什么?

***Prometheus是一个开源监控系统***.
Prometheus是由SoundCloud开发的开源监控报警系统和时序列数据库(TSDB).Prometheus使用Go语言开发,是Google BorgMon监控系统的开源版本.

### 1.1 Prometheus 的优势

1. 由指标名称和和键/值对标签标识的时间序列数据组成的多维数据模型.
2. 强大的查询语言 PromQL.
3. 不依赖分布式存储;单个服务节点具有自治能力.
4. 时间序列数据是服务端通过 HTTP 协议主动拉取获得的.
5. 也可以通过中间网关来推送时间序列数据.
6. 可以通过静态配置文件或服务发现来获取监控目标.
7. 支持多种类型的图表和仪表盘.

### 1.2 Prometheus 的组件

Prometheus 生态系统由多个组件组成,其中大多数组件都是用 Go 编写的,因此很容易构建和部署为静态二进制文件,其中有许多组件是可选的：

- Prometheus Server 作为服务端,用来存储时间序列数据.
- 客户端库用来检测应用程序代码.
- 用于支持临时任务的推送网关.
- Exporter 用来监控 HAProxy,StatsD,Graphite 等特殊的监控目标,并向 Prometheus 提供标准格式的监控样本数据.
- alartmanager 用来处理告警.
- 其他各种周边工具.

其实Prometheus也是以重时序数据库.

## 2. 什么是TSDB?

TSDB(Time Series Database)时序列数据库,我们可以简单的理解为一个优化后用来处理时间序列数据的软件,并且数据中的数组是由时间进行索引的.

### 2.1 TSDB时间序列数据库数据写入的特点

1. ***写入平稳,持续,高并发高吞吐***：时序数据的写入是比较平稳的,这点与应用数据不同,应用数据通常与应用的访问量成正比,而应用的访问量通常存在波峰波谷.时序数据的产生通常是以一个固定的时间频率产生,不会受其他因素的制约,其数据生成的速度是相对比较平稳的.
2. ***写多读少***：时序数据上95%-99%的操作都是写操作,是典型的写多读少的数据.这与其数据特性相关,例如监控数据,您的监控项可能很多,但是您真正去读的可能比较少,通常只会关心几个特定的关键指标或者在特定的场景下才会去读数据.
3. ***实时写入最近生成的数据,无更新***：时序数据的写入是实时的,且每次写入都是最近生成的数据,这与其数据生成的特点相关,因为其数据生成是随着时间推进的,而新生成的数据会实时的进行写入.数据写入无更新,在时间这个维度上,随着时间的推进,每次数据都是新数据,不会存在旧数据的更新,不过不排除人为的对数据做订正.

### 2.2  TSDB时间序列数据库数据查询和分析的特点

- ***按时间范围读取***：通常来说,您不会去关心某个特定点的数据,而是一段时间的数据.
- ***最近的数据被读取的概率高***
- ***历史数据粗粒度查询的概率搞***
- ***多种精度查询***
- ***多维度分析***
- ***数据存储的特点***

接下来的例子中将主要介绍把Prometheus当作时序数据库TSDB,应用到Go语言业务app中做数据统计分析.
我们将着重介绍***Prometheus 客户端***在Go语言中自定义.

## 3. Prometheus 在Go语言app实践

Prometheus的Client Library提供度量的四种基本类型包括:Counter,Gauge,Histogram,Summary.

1. ***Counter类型***,Counter类型好比计数器,用于统计类似于：CPU时间,API访问总次数,异常发生次数等等场景.
2. ***Gauge类型***,英文直译的话叫“计量器”,但是和Counter的翻译太类似了,因此我个人更喜欢使用”仪表盘“这个称呼.
3. ***Histogram柱状图***,更多的是用于统计一些数据分布的情况,用于计算在一定范围内的分布情况,同时还提供了度量指标值的总和.
4. ***Summary摘要***, 和Histogram柱状图比较类似,主要用于计算在一定时间窗口范围内度量指标对象的总数以及所有对量指标值的总和.

### 3.1 官方 Golang Prometheus Client Example 代码注释详解

官方Golang Prometheus Client 业务代码流程:

1. 创建 Prometheus Metric数据项,可export被其他包可以访问
2. 注册定义好的Metric 相当于执行SQL create table
3. 业务在无代码中想插入对时序书库TSDB数据想的数据写入操作,相当与时序SQL insert. 这部分代码可以放在自己的其他包的业务逻辑中去
4. 提供HTTP API接口,让Prometheus 主程序定时来收集TSDB数据.

```go
package main

import (
	"flag"
	"log"
	"math"
	"math/rand"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	addr              = flag.String("listen-address", ":8080", "The address to listen on for HTTP requests.")
	uniformDomain     = flag.Float64("uniform.domain", 0.0002, "The domain for the uniform distribution.")
	normDomain        = flag.Float64("normal.domain", 0.0002, "The domain for the normal distribution.")
	normMean          = flag.Float64("normal.mean", 0.00001, "The mean for the normal distribution.")
	oscillationPeriod = flag.Duration("oscillation-period", 10*time.Minute, "The duration of the rate oscillation period.")
)

var (
	// 1. 创建 Prometheus 数据Metric, 就相当于SQL 数据库 声明table
	// Create a summary to track fictional interservice RPC latencies for three
	// distinct services with different latency distributions. These services are
	// differentiated via a "service" label.
	RpcDurations = prometheus.NewSummaryVec(
		prometheus.SummaryOpts{
			Name:       "rpc_durations_seconds",
			Help:       "RPC latency distributions.这个metric的帮助信息,metric的项目作用说明",
			Objectives: map[float64]float64{0.5: 0.05, 0.9: 0.01, 0.99: 0.001},
		},
		[]string{"service"},
	)
	// The same as above, but now as a histogram, and only for the normal
	// distribution. The buckets are targeted to the parameters of the
	// normal distribution, with 20 buckets centered on the mean, each
	// half-sigma wide.
	RpcDurationsHistogram = prometheus.NewHistogram(prometheus.HistogramOpts{
		Name:    "rpc_durations_histogram_seconds",
		Help:    "RPC latency distributions.这个metric的帮助信息,metric的项目作用说明",
		Buckets: prometheus.LinearBuckets(*normMean-5**normDomain, .5**normDomain, 20),
	})
)

func init() {
	// 2. 注册定义好的Metric 相当于执行SQL create table 语句
	// Register the summary and the histogram with Prometheus's default registry.
	prometheus.MustRegister(RpcDurations)
	prometheus.MustRegister(RpcDurationsHistogram)
	// Add Go module build info.
	prometheus.MustRegister(prometheus.NewBuildInfoCollector())
}

func main() {
	flag.Parse()

	start := time.Now()

	oscillationFactor := func() float64 {
		return 2 + math.Sin(math.Sin(2*math.Pi*float64(time.Since(start))/float64(*oscillationPeriod)))
	}
    // 3. 业务在无代码中想插入对时序书库TSDB数据想的数据写入操作,相当与SQL insert
	// Periodically record some sample latencies for the three services.
	go func() {
		for {
			v := rand.Float64() * *uniformDomain
			RpcDurations.WithLabelValues("uniform").Observe(v)
			time.Sleep(time.Duration(100*oscillationFactor()) * time.Millisecond)
		}
	}()

	go func() {
		for {
			v := (rand.NormFloat64() * *normDomain) + *normMean
			RpcDurations.WithLabelValues("normal").Observe(v)
			RpcDurationsHistogram.Observe(v)
			time.Sleep(time.Duration(75*oscillationFactor()) * time.Millisecond)
		}
	}()

	go func() {
		for {
			v := rand.ExpFloat64() / 1e6
			RpcDurations.WithLabelValues("exponential").Observe(v)
			time.Sleep(time.Duration(50*oscillationFactor()) * time.Millisecond)
		}
	}()

    // 4. 提供HTTP API接口,让Prometheus 主程序定时来收集时序数据
	// Expose the registered metrics via HTTP.
	http.Handle("/metrics", promhttp.Handler())
	log.Fatal(http.ListenAndServe(*addr, nil))
}
```

### 3.2 业务代码示例:Gin App 统计API请求数量

这里有一个Golang gin HTTP API app 我想统计API请求相关信息.

#### 第一步:初始换监控项Metric

在我的项目创建package stat,初始化API 请求相关的Metric.注册到`github.com/prometheus/client_golang/prometheus`
stat/prometheus.go

```go
package stat

import (
	"github.com/prometheus/client_golang/prometheus"
)

var (
	// The same as above, but now as a histogram, and only for the normal
	// distribution. The buckets are targeted to the parameters of the
	// normal distribution, with 20 buckets centered on the mean, each
	// half-sigma wide.
	//GaugeVecApiDuration = prometheus.NewHistogram(prometheus.HistogramOpts{
	//	Name:    "HttpDuration",
	//	Help:    "api requset 耗时单位ms",
	//	Buckets: prometheus.LinearBuckets(0, 1000, 50),
	//})
	GaugeVecApiDuration = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Name: "apiDuration",
		Help: "api耗时单位ms",
	}, []string{"WSorAPI"})
	GaugeVecApiMethod = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Name: "apiCount",
		Help: "各种网络请求次数",
	}, []string{"method"})
	GaugeVecApiError = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Name: "apiErrorCount",
		Help: "请求api错误的次数type: api/ws",
	}, []string{"type"})
)

func init() {
	// Register the summary and the histogram with Prometheus's default registry.
	prometheus.MustRegister(GaugeVecApiMethod, GaugeVecApiDuration, GaugeVecApiError)
}
```

#### 第二步:在业务代码中采集数据

1. 创建mw_prometheus_http.go,统计API 请求持续的实践和Method的计数,代码如下

````go
package handler

import (
	"fortress/stat"//导入第一步中初始换好的stat(prometheus client_golang 初始化包中的监控项)
	"github.com/gin-gonic/gin"
	"time"
)

func MwPrometheusHttp(c *gin.Context) {
	start := time.Now()
	method := c.Request.Method
	stat.GaugeVecApiMethod.WithLabelValues(method).Inc()

	c.Next()
	// after request
	end := time.Now()
	d := end.Sub(start) / time.Millisecond
	stat.GaugeVecApiDuration.WithLabelValues(method).Set(float64(d))
}
````

2. 统计API 错误返回的数量

`stat.GaugeVecApiError.WithLabelValues("API").Inc()` inc 来记录API 发送的现错误
handler/helper.go

```go
import (
	"fortress/stat"
)
func jsonError(c *gin.Context, msg interface{}) {
	stat.GaugeVecApiError.WithLabelValues("API").Inc()
	var ms string
	switch v := msg.(type) {
	case string:
		ms = v
	case error:
		ms = v.Error()
	default:
		ms = ""
	}
	c.AbortWithStatusJSON(200, gin.H{"ok": false, "msg": ms})
}
```

大家可以举一反三.

#### 第三步: gin app 提供/metric接口给prometheus TSDB时序数据库收集数据

提供metrics接口给prometheus TSDB时序数据库收集数据 `r.GET("metrics", gin.WrapH(promhttp.Handler()))`

使用第一步定义的中间件统计API接口信息:`r.GET("metrics", gin.WrapH(promhttp.Handler()))`

```go
...
	r.GET("metrics", gin.WrapH(promhttp.Handler()))
	api := r.Group("api").Use(handler.MwPrometheusHttp)
...

```

#### 第四步:Prometheus 主程序Pull数据.

最后一步,在Prometheus主程序的配置文件填写第三步的API接口信息,Prometheus TSDB时序数据库开始定时收集metric数据

#### 第五步:数据展示

Prometheus 提供了一种功能表达式语言 PromQL,
允许用户实时选择和汇聚时间序列数据.表达式的结果可以在浏览器中显示为图形,也可以显示为表格数据,或者由外部系统通过 HTTP API 调用.

当然您可以参照这个这篇文章: [使用Prometheus和Grafana做可视化大屏展示](/2019/08/20/dash-graph-of-prometheus)做数据展示.