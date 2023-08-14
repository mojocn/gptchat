---
layout: post
title: Seaweedfs设计原理
category: Misc
tags: seaweedfs
description: Seaweedfs设计原理
date: 2018-12-26T13:19:54+08:00
---

基于源码版本号 0.67 , 【Seaweedfs以前旧版叫Weedfs】.

[Seaweedfs] 是一个非常优秀的由 golang 开发的分布式存储开源项目,
虽然在我刚开始关注的时候它在 github.com 上面只有 star 50+,
但是我觉得这个项目是一个几千 star 量级的优秀开源项目.
[Seaweedfs] 的设计原理是基于 Facebook 的一篇图片存储系统的论文 [Facebook-Haystack],
论文很长,但是其实原理就几句话,可以看看 [Facebook图片存储系统Haystack] ,
我觉得[Seaweedfs]是青出于蓝而胜于蓝.

[Seaweedfs] 这个开源系统涵盖的面比较多,
很难在一篇文章里面说清楚,
只能尽可能清楚的说说主要的部分.

## 源码目录结构

### 核心模块

- weed 入口目录
- weed/weed\_server 入口目录与HTTP服务相关
- topology 核心模块,主要包括 【DataCenter, Rack, DataNode】 三层拓扑结构.
- storage 核心模块,主要包括【Store, Volume, Needle】这三大块存储相关的源码.

### 辅助模块

- sequence 负责FileID的全局有序生成
- filer 提供支持 HTTP REST 操作的文件服务器,其实就是基于 leveldb 把文件名和目录结构存储起来.
- stats 和操作系统内存和磁盘使用状况有关的模块
- operation 由protobuf生成的代码们
- proto 存放protobuf的描述文件
- glog 日志模块
- images 图片服务
- util 工具函数
- tools 工具,暂时只有一个读索引的文件.

## 多数据节点维护之 Topology

topology 整个模块最核心的数据结构是三个：

+ DataCenter
+ Rack
+ DataNode

topology 是树状结构,DataNode 是树的叶子节点,
DataCenter 和 Rack 是树的非叶子节点,
DataCenter 是 Rack 的父母节点.
如下图

```
            DataCenter
                |
                |
       ------------------
       |                |
       |                |
      Rack            Rack
       |
       |
   ------------
   |          |
   |          |
 DataNode  DataNode
```

也就是在 MasterServer 维护的拓扑结构里,
是把 VolumeServer 的相关信息存储在 DataNode 里,
所以在代码里面可以看到如下：

```
dc := t.GetOrCreateDataCenter(dcName)
rack := dc.GetOrCreateRack(rackName)
dn := rack.FindDataNode(*joinMessage.Ip, int(*joinMessage.Port))
```

每次查找对应的DataNode,都需要从 DataCenter -> Rack -> DataNode 依次找下去.

## 数据存储

### 理解Fid

```
curl -F "file=@/tmp/test.pdf" "127.0.0.1:9333/submit"
{"fid":"1,01f96b93eb","fileName":"test.pdf","fileUrl":"localhost:8081/1,01f96b93eb","size":548840}
```

其中 `"fid":"1,01f96b93eb"` 就是 Fid,Fid 由三个部分组成 【VolumeId, NeedleId, Cookie】 组成.

+ VolumeId: 1 32bit 存储的物理卷的Id
+ NeedleId: 01 64bit 全局唯一NeedleId,每个存储的文件都不一样(除了互为备份的).
+ Cookie: f96b93eb 32bit Cookie值,为了安全起见,防止恶意攻击.

其中 VolumeId 是由 MasterServer 分配给 VolumeServer,
每个 VolumeServer 都维护个 n 个 Volume ,
每个 Volume 都有一个专属 VolumeId,之后会细说.
Needle 属于 Volume 里面的一个单元,后续说.

### Volume

```
type Volume struct {
    Id         VolumeId
    dir        string
    Collection string
    dataFile   *os.File
    nm         NeedleMapper
    readOnly   bool

    SuperBlock

    accessLock       sync.Mutex
    lastModifiedTime uint64 //unix time in seconds
}
```

+ VolumeId 通俗易懂,比如 `"fid":"3,01f9896771"` 里面逗号前面的 3 就是 VolumeId .
+ dir 就是该 Volume 所在的目录,
+ Collection 很有用,每个 Volume 只能对应同一个 Collection,不同 Collection 的图片存储在不同 Volume,后面会讲到.
+ 所以同一个 Volume 只能针对某一个 Collection ,而 同一个 Collection 的图片可能分布在不同的 Volume.
  dataFile 就是对应的文件句柄.
+ nm NeedleMapper 看上去像是个 map ,其实是个列表,包含多个 Needle ,后面会讲到.
+ readOnly 是否只读
+ SuperBlock 超块,后面会讲到.
+ accessLock 互斥锁
+ lastModifiedTime 最近修改时间

以上最关键的两个点就是 SuperBlock 和 NeedleMapper ,
这两者在文件中布局如下：

```
+-------------+
|SuperBlock   |
+-------------+
|Needle1      |
+-------------+
|Needle2      |
+-------------+
|Needle3      |
+-------------+
|Needle ...   |
+-------------+
```

```
1 Volume = 1 SuperBlock + n Needle
```

### SuperBlock

```
/*
* Super block currently has 8 bytes allocated for each volume.
* Byte 0: version, 1 or 2
* Byte 1: Replica Placement strategy, 000, 001, 002, 010, etc
* Byte 2 and byte 3: Time to live. See TTL for definition
* Rest bytes: Reserved
 */
type SuperBlock struct {
    version          Version
    ReplicaPlacement *ReplicaPlacement
    Ttl              *TTL
}
```

SuperBlock 内维护的数据基本上就是该 Volume 的元数据.

+ ReplicaPlacement  : 在后面的 Replication 会讲
+ Ttl :Time To Live 为了定时删除的功能

【TTL】

定时删除功能,这个感觉很酷炫,但是在Seaweedfs里面的实现原理很简单,
按 Volume 来进行分块,当每次用户上传一个自带TTL的文件（需要定时删除的文件）时,
会把这个文件存储在合适的 Volume 里面（如何选出合适的 Volume 之后再说）,
存储的时候每个文件会带有 TTL 这个属性,
当读取出来之后发现该文件已经过期（超时时间到）,则会返回一个 Not Found 结果,
而每个 Volume 维护一个最大超时时间,当这个时间抵达时,说明整个 Volume 所有的文件都超时了,
然后 VolumeServer 通知 MasterServer 这个 Volume 已经被标识为 Dead 状态,
意味着 MasterServer 不会再为这个 Volume 分配新的 Fid.
然后再经过一段合适的时间后由 VolumeServer 将这个 Volume 从磁盘上安全的删除掉.
详细请看在[Seaweedfs]自带的文档[ttl],

### Needle

```
/*
* A Needle means a uploaded and stored file.
* Needle file size is limited to 4GB for now.
 */
type Needle struct {
    Cookie uint32 `comment:"random number to mitigate brute force lookups"`
    Id     uint64 `comment:"needle id"`
    Size   uint32 `comment:"sum of DataSize,Data,NameSize,Name,MimeSize,Mime"`

    Data         []byte `comment:"The actual file data"`
    DataSize     uint32 `comment:"Data size"` //version2
    Flags        byte   `comment:"boolean flags"` //version2
    NameSize     uint8  //version2
    Name         []byte `comment:"maximum 256 characters"` //version2
    MimeSize     uint8  //version2
    Mime         []byte `comment:"maximum 256 characters"` //version2
    LastModified uint64 //only store LastModifiedBytesLength bytes, which is 5 bytes to disk
    Ttl          *TTL

    Checksum CRC    `comment:"CRC32 to check integrity"`
    Padding  []byte `comment:"Aligned to 8 bytes"`
}
```

Needle 结构体里面的 Cookie 和 Id 就是上文提过的 Fid 里面的 Cookie 和 NeedleId,
其他就是一些存储相关的变量,没什么奇淫巧计.就是简单的存储结构而已.

## 数据备份之 Replication

Replication 和 Topology 严重相关,
在配置文件中可以配置多种备份模式,详见 [seaweedfs-wiki] .

```
+-----+---------------------------------------------------------------------------+
|001  |replicate once on the same rack                                            |
+-----+---------------------------------------------------------------------------+
|010  |replicate once on a different rack in the same data center                 |
+-----+---------------------------------------------------------------------------+
|100  |replicate once on a different data center                                  |
+-----+---------------------------------------------------------------------------+
|200  |replicate twice on two other different data center                         |
+-----+---------------------------------------------------------------------------+
```

比如在 001 模式,即在同一个 rack 中的不同 DataNode 中备份一份.
假设在 rack1 中含有 DataNode1, DataNode2, DataNode3 三个数据节点中【随机】选出两个数据节点,
比如选出 DataNode1, DataNode2 然后同时写入这两个数据节点.
假设 rack1 只有一个数据节点的时候,而备份模式是 001 模式,
则无法正常备份,服务会报错.

注意到,选择备份数据节点的方法是【随机】,所以就会出现从三个数据节点中随机选择两个的情况下,

```
curl -v -F "file=@/tmp/test.json" localhost:8081/5,1ce2111f1
```

topo.NextVolumeId 负责生成 VolumeId ,
负责在 VolumeGrowth 里的时候分配 Volume 的时候,
生成一个全局唯一的新 VolumeId,
在 Weed-fs 中,是支持 多 MasterServer 集群的.
当有多个 MasterServer,生成一个全局唯一的新 VolumeId 是很重要,
在 Weed-fs 中是通过 [goraft] 来实现的.

【强一致性】

Seaweedfs 的备份实现是强一致性的.
当一个 VolumeServer 接受到上传文件的 POST 请求时,
将该文件作为一个 Needle 写入本地 Volume 之后,
会根据该文件所分配的 VolumeId 判断是否需要备份,
如果需要备份,则进行备份（需要请求另外其它的 VolumeServer 服务器）.
过程详见 `ReplicatedWrite` (topology/store_replicate.go).
当备份完毕后,再对该 POST 请求进行答复.
所以用户每次上传图片时,当收到了答复之后,
则可以认为此备份已完成.这个和最终一致性不同,属于强一致性.

上述实现强一致性的过程中,
有个必要条件就是【 VolumeServer 需要知道往其它那些 VolumeServer 备份】.
在 Seaweedfs 的实现中是借助 MasterServer 来实现,
因为备份的基本单位是 Volume,
在 MasterServer 中,对每个 VolumeId 都维护对应的备份机器列表.
可以通过如下示例命令查看:

```
curl "localhost:9333/dir/lookup?volumeId=4&pretty=y"
{
  "volumeId": "4",
  "locations": [
    {
      "url": "127.0.0.1:8081",
      "publicUrl": "localhost:8081"
    },
    {
      "url": "127.0.0.1:8080",
      "publicUrl": "localhost:8080"
    }
  ]
}
```

如上示例中可以看出,对应的 volumeId=4 的 Volume,
可以看出对应的备份机器列表有两台,分别是 "127.0.0.1:8081" 和 "127.0.0.1:8080" .

实际上对于每台 VolumeServer 查找其它备份机器的时候,
也是通过如上 HTTP api 向 MasterServer 询问.
只不过不是每次都询问,因为只要询问过了之后就会缓存下来,只有在缓存里面找不到才询问.

【Collection】

示例如下：

启动 MasterServer

```
weed master
```

启动 VolumeServer

```
weed volume -dir="/tmp/data1" -max=5  -mserver="localhost:9333" -port=8080
```

申请Fid

```
curl "http://127.0.0.1:9333/dir/assign?collection=pictures"
{"fid":"4,01d50c6fbf","url":"127.0.0.1:8080","publicUrl":"localhost:8080","count":1}
```

```
curl "http://127.0.0.1:9333/dir/assign?collection=mp3"
{"error":"No free volumes left!"}
```

```
curl "http://127.0.0.1:9333/dir/assign?collection=pictures"
{"fid":"5,0147ed0fb7","url":"127.0.0.1:8080","publicUrl":"localhost:8080","count":1}
```

申请Fid的示例解释：

1.

因为默认情况下,VolumeServer 启动时,
未申请任何 Volume,当第一次 `/dir/assign` 的时候,
会分配 Volume,因为 `weed volume` 的参数 `-max=5`
所以一次性分配 5 个 Volume ,并且这 5 个 Volume 的 Collection 属性都是 pictures,
甚至可以看到在 `ls /tmp/data1` 的结果如下：

```
/tmp/data1
pictures_1.dat pictures_1.idx pictures_2.dat pictures_2.idx pictures_3.dat pictures_3.idx pictures_4.dat pictures_4.idx pictures_5.dat pictures_5.idx
```

可以看出每个卷的文件名以 Collection 来命名.

2.

因为已有的 5 个 Volume 的 Collection 属性都是 pictures,
所以此时如果需要 `/dir/assign` 一个非 pictures Collection 的 Fid 时失败,

3.

当申请一个属于 pictures Collection 的 Fid 成功.

也就是在每次申请 Fid 时,会针对 Collection 进行检查,来保证存入 Volume 的每个 Needle 所属的 Collection 一致.
在实际应用中可以通过 Collection 来类别的分片.

【Volume 的大小限制】

在每次 VolumeServer 向 MasterServer 发送心跳信息的时候,
会在 storage.VolumeInfo.Size 里面注明当前 Volume 的大小信息(Size).
所以可以以此来限制 Volume 的大小.
如下函数：

```
func (vl *VolumeLayout) isWritable(v *storage.VolumeInfo) bool {
    return uint64(v.Size) < vl.volumeSizeLimit &&
        v.Version == storage.CurrentVersion &&
        !v.ReadOnly
}
```

当 VolumeInfo.Size 大于 VolumeLayout.volumeSizeLimit 时,
则将该 Volume 标记为不可写.
而 VolumeLayout.volumeSizeLimit 的值可以在启动 MasterServer 的时候配置.
由 `weed help master` 可知：

```
-volumeSizeLimitMB=30000: Master stops directing writes to oversized volumes.
```

每个 Volume 的最大 Size 默认是 30G ,
而每个 VolumeServer 可以配置 n 个 Volume,根据所在机器不同的硬盘大小配置不同的 n .
由 `weed help volume` 可知：

```
-max="7": maximum numbers of volumes, count[,count]...
```

每个 VolumeServer 默认的 Volume 大小是 7 .

所以默认情况下,当一个 VolumeServer 使用的磁盘超过 7 * 30G = 210G 之后,
该 VolumeServer 属于只读状态, MasterServer 不会再分配新的 Fid 给它.

但是其实这里会有漏洞,如果此时不通过请求 MasterServer 获取 Fid,
而是直接自己构造 Fid 向 VolumeServer POST 文件的话,
VolumeServer 还是会一直接受上传的文件,
直到大小超过在 `storage/needle.go` 里面写死的一个常量：

```
MaxPossibleVolumeSize = 4 * 1024 * 1024 * 1024 * 8
```

其实在 VolumeServer 里面也有维护一个变量叫 volumeSizeLimit ,

```
type Store struct {
    ...
    volumeSizeLimit uint64 //read from the master
    ...
}
```

此变量的值是从 MasterServer 获取的,
当每次 VolumeServer 写入 Needle 到 Volume 的时候,
都会检查 Volume Size 是否超过 volumeSizeLimit ,
当超过的时候会打错误日志,
但是不会停止写入,也就是不会拒绝上传的文件.
**有且只有**当大小超过 MaxPossibleVolumeSize 的时候才会拒绝写入磁盘.

【扩容】

对于 Seaweedfs 来说,扩容非常简单,

启动 MasterServer:

```
./weed master -mdir="/tmp/weed_master_tmp"
```

启动 VolumeServer1:

```
weed volume -dir="/tmp/data1" -max=5  -mserver="localhost:9333" -port=8080
```

当 VolumeServer1 因为抵达 Volume 大小上限而无法继续接受上传数据时,
此时继续 submit 上传数据 MasterServer 则会返回错误(因为在 MasterServer 内已经将 VolumeServer1 标记为不可写).

```
curl -F "file=@/tmp/test.pdf" "127.0.0.1:9333/submit"
{"error":"No free volumes left!"}
```

此时直接再启动 VolumeServer2 即可

```
weed volume -dir="/tmp/data2" -max=5  -mserver="localhost:9333" -port=8081
```

此时 VolumeServer2 启动之后会自动向 MasterServer 的 Topology 结构注册新的 DataNode ,
当 MasterServer 接受到新的 submit 请求的时候,会将该上传文件写入 VolumeServer2 （因为此时 VolumeServer1 已经不可写）.

也就是说如果当线上出现容量问题的时候,扩容只需要加机器即可,简单有效.

## 总结

+ 每个 MasterServer 通过 Topology 维护多个 VolumeServer .
+ 每个 VolumeServer 维护多个 Volume .
+ 每个 Volume 包含多个 Needle ,Needle 即文件.
+ 多台 VolumeServer 之间的多机备份实现是强一致性.
+ 多台 MasterServer 之间的主从关系是是通过 [goraft] 实现.

[seaweedfs-wiki]:https://github.com/chrislusf/seaweedfs/wiki

[Seaweedfs]:https://github.com/chrislusf/seaweedfs

[ttl]:https://github.com/chrislusf/seaweedfs/wiki/Store-file-with-a-Time-To-Live

[Facebook-Haystack]:https://www.usenix.org/legacy/event/osdi10/tech/full_papers/Beaver.pdf

[Facebook图片存储系统Haystack]:http://yanyiwu.com/work/2015/01/04/Haystack.html

[goraft]:https://github.com/goraft/raft