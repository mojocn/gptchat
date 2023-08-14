---
layout: post
title: "Go进阶41:Golang从零开发BitTorrent客户端(翻译)"
category: Golang
tags: Go进阶 
keywords: "torrent,p2p,peer-to-peer,hash,tracker"
description: "在Go中从头开始构建一个BitTorrent客户端(翻译)"
coverage: golang_torrent_coverage.png
permalink: /go/:title
date: 2020-01-07T16:06:00+08:00
---

## 1. TL;DR

> TL;DR 可以是Too long; Didn't read（太长,所以没有看). 也可以是Too long; Don't read(太长,请不要看),常作为一篇很长的文章的摘要标题.

在本文中,我们将实现足够的BitTorrent协议来下载Debian.查看[源代码](https://github.com/veggiedefender/torrent-client/)或跳到文章最后.

BitTorrent是用于在Internet上下载和分发文件的协议.与传统的客户端/服务器关系不同.
在传统的客户端/服务器关系中.下载器连接到中央服务器（例如：在Netflix上观看电影或加载您正在阅读的网页).
BitTorrent网络中的参与者（称为peers)之间交换下载文件的分块-这就是p2p(peer-to-peer).
我们将研究其工作原理.并建立自己的客户端.该客户端可以找到peers并在它们之间交换数据.

![](/assets/image/golang_torrent_01.png)

在过去的20年中.该协议有益的演进.很多人和组织添加了加密.私人种子和寻找peer的新方法等功能的扩展.
我们将从2001年开始实施[原始规范](https://www.bittorrent.org/beps/bep_0003.html).以确保这是一个周末工作量大小的项目.

我将使用Debian ISO文件作为实验品.因为它体积不大不小.只有350MB.
作为流行的Linux发行版.将有许多高速而开放的peer可供我们快速下载.而且.我们将避免与下载盗版内容相关的法律和道德问题.

## 2. 寻找peers

这是一个问题：我们想使用BitTorrent下载文件.但这是p2p协议.
我们不知道在哪里可以找到要从中下载文件的peers.
这就像搬到新城市并尝试结交朋友一样.也许我们会去当地的酒吧或party！像这样的中心位置是Tracker服务器背后的重要思想.
Tracker服务器是将对peers引荐peers.
Tracker服务器只是运行在HTTP *上的 Web服务器 .您可以在http://bttracker.debian.org:6969/中找到Debian.

![](/assets/image/golang_torrent_02.png)

当然.如果这些中央服务器有利于同级交换非法内容.则很容易遭到联邦政府的突袭.
您可能还记得读过有关TorrentSpy.Popcorn Time和KickassTorrents等Tracker服务器的信息.这些Tracker服务器被抓住并关闭了.
新方法通过使对peers发现成为分布式过程来消除中间人.我们不会实现它们.但是如果您有兴趣.可以研究的一些术语是DHT.PEX和磁链.

### 2.1 解析Torrent种子文件

`.torrent`文件描述了torrentable文件的内容以及用于连接到Tracker服务器的信息.
这是我们启动Torrent下载过程所需要的.Debian的.torrent文件如下所示：

```go
d8:announce41:http://bttracker.debian.org:6969/announce7:comment35:"Debian CD from cdimage.debian.org"13:creation datei1573903810e9:httpseedsl145:https://cdimage.debian.org/cdimage/release/10.2.0//srv/cdbuilder.debian.org/dst/deb-cd/weekly-builds/amd64/iso-cd/debian-10.2.0-amd64-netinst.iso145:https://cdimage.debian.org/cdimage/archive/10.2.0//srv/cdbuilder.debian.org/dst/deb-cd/weekly-builds/amd64/iso-cd/debian-10.2.0-amd64-netinst.isoe4:infod6:lengthi351272960e4:name31:debian-10.2.0-amd64-netinst.iso12:piece lengthi262144e6:pieces26800:�����PS�^�� (binary blob of the hashes of each piece)ee
```

这坨字符串是Bencode（发音为bee-encode)的格式编码.我们需要对其进行解码.

Bencode可以对与JSON大致相同的结构类型进行编码-字符串.整数.列表和字典.
Bencoded数据不像JSON那样易于人读/写.但是它可以有效地处理二进制数据.并且很容易从Torrent进行解析.
字符串带有一个长度前缀.看起来像4:spam.整数位于开始标记符和结束标记符之间.因此7将编码为i7e.
列表和字典的工作方式相似：l4:spami7ee表示['spam', 7].而d4:spami7ee表示{spam: 7}.

以更漂亮的格式.我们的`.torrent`文件如下所示：

```go
d
  8:announce
    41:http://bttracker.debian.org:6969/announce
  7:comment
    35:"Debian CD from cdimage.debian.org"
  13:creation date
    i1573903810e
  4:info
    d
      6:length
        i351272960e
      4:name
        31:debian-10.2.0-amd64-netinst.iso
      12:piece length
        i262144e
      6:pieces
        26800:�����PS�^�� (binary blob of the hashes of each piece)
    e
e
```

在此文件中.我们可以发现Tracker服务器的URL.创建日期（以Unix时间戳记).文件的名称和大小以及包含每个片段的SHA-1哈希值的大二进制blob.这些哈希值相等.
我们要下载的文件的大小部分.
种子的确切大小因种子而异.但它们通常在256KB至1MB之间.
这意味着一个大文件可能由数千个文件组成.我们将从Peers那里下载这些片段.将它们与种子文件中的哈希值进行对照.
将它们组装在一起.BOOM.我们有一个文件！

![](/assets/image/golang_torrent_03.png)

这种机制使我们能够在进行过程中验证每个文件片段的完整性.
它使BitTorrent能够抵抗意外损坏或恶意torrent中毒.除非攻击者能够通过preimage攻击破坏SHA-1.否则我们将确切获得我们所要求的内容.

编写一个bencode解析器真的很有趣.但是解析并不是我们今天的重点.
但是我发现Fredrik Lundh的50行解析器特别具有启发性.
对于这个项目.我使用了[om/jackpal/bencode-go](https://github.com/jackpal/bencode-go):

```go
import (
    "github.com/jackpal/bencode-go"
)

type bencodeInfo struct {
    Pieces      string `bencode:"pieces"`
    PieceLength int    `bencode:"piece length"`
    Length      int    `bencode:"length"`
    Name        string `bencode:"name"`
}

type bencodeTorrent struct {
    Announce string      `bencode:"announce"`
    Info     bencodeInfo `bencode:"info"`
}

// Open parses a torrent file
func Open(r io.Reader) (*bencodeTorrent, error) {
    bto := bencodeTorrent{}
    err := bencode.Unmarshal(r, &bto)
    if err != nil {
        return nil, err
    }
    return &bto, nil
}

```

因为我喜欢保持项目代码结构相对平坦.并且我希望将应用程序结构与序列化结构分开.所以我导出了另一个更平坦的结构.
TorrentFile并编写了一些辅助函数以在两者之间进行转换.

值得注意的是.我将pieces（以前是一个字符串)拆分为一片哈希（每个[20]byte).以便以后可以轻松访问各个哈希.
我还计算了整个bencoded infodict（包含名称.大小和片段哈希的dict)的SHA-1哈希.
我们将其称为infohash.在与Tracker服务器和Peer设备对话时.它唯一地标识文件.稍后对此进行更多讨论.

![](/assets/image/golang_torrent_04.png)

```go
type TorrentFile struct {
    Announce    string
    InfoHash    [20]byte
    PieceHashes [][20]byte
    PieceLength int
    Length      int
    Name        string
}

func (bto *bencodeTorrent) toTorrentFile() (*TorrentFile, error) {
    // ...
}
```

### 2.2 从Tracker服务器获取Peers

既然我们已经掌握了有关文件及其Tracker服务器的信息.那么让我们与Tracker服务器进行对话.
高速Tracker服务器我(BT客户端)我连接上了,同事获取其他Peers的信息.
我们只需要对torrent文件中提供的announce.URL 进行GET请求.并带有一些查询参数：

```go
func (t *TorrentFile) buildTrackerURL(peerID [20]byte, port uint16) (string, error) {
    base, err := url.Parse(t.Announce)
    if err != nil {
        return "", err
    }
    params := url.Values{
        "info_hash":  []string{string(t.InfoHash[:])},
        "peer_id":    []string{string(peerID[:])},
        "port":       []string{strconv.Itoa(int(Port))},
        "uploaded":   []string{"0"},
        "downloaded": []string{"0"},
        "compact":    []string{"1"},
        "left":       []string{strconv.Itoa(t.Length)},
    }
    base.RawQuery = params.Encode()
    return base.String(), nil
}
```

重要的是：

- info_hash：标识我们要下载的文件.这是我们之前根据本编码的infodict 计算出的信息哈希.Tracker服务器将使用它来确定向我们显示哪些Peers.
- peer_id：一个20字节的名称.用于向跟踪者和Peers标识自己.我们将为此生成20个随机字节.真正的BitTorrent客户端具有ID.
  例如ID -TR2940-k8hj0wgej6ch.用于标识客户端软件和版本-在这种情况下.TR2940代表传输客户端2.94.

![](/assets/image/golang_torrent_05.png)

### 2.3 解析Tracker服务器Response

我们返回一个经过编码的响应：

```
d
  8:interval
    i900e
  5:peers
    252:(another long binary blob)
e
```

Interval告诉我们应该多久再次连接到Tracker服务器以刷新我们的Peers列表.值900表示我们应该每15分钟（900秒)重新连接一次.

Peers是另一个长二进制Blob.其中包含每个Peers的IP地址.它由六个字节组成.每个组中的前四个字节代表Peers的IPv4地址-每个字节代表IP中的数字.
最后两个字节将端口表示为big-endian uint16.Big-endian或网络顺序.意味着我们可以将一组字节解释为整数.而只需将它们从左到右挤压在一起即可.
例如.十进制的bytes 0x1A.0xE1 -> 0x1AE1代表6881.

![](/assets/image/golang_torrent_06.png)

```go
// Peer encodes connection information for a peer
type Peer struct {
    IP   net.IP
    Port uint16
}

// Unmarshal parses peer IP addresses and ports from a buffer
func Unmarshal(peersBin []byte) ([]Peer, error) {
    const peerSize = 6 // 4 for IP, 2 for port
    numPeers := len(peersBin) / peerSize
    if len(peersBin)%peerSize != 0 {
        err := fmt.Errorf("Received malformed peers")
        return nil, err
    }
    peers := make([]Peer, numPeers)
    for i := 0; i < numPeers; i++ {
        offset := i * peerSize
        peers[i].IP = net.IP(peersBin[offset : offset+4])
        peers[i].Port = binary.BigEndian.Uint16(peersBin[offset+4 : offset+6])
    }
    return peers, nil
}
```

## 3. 从Peers下载

现在我们有了一个Peers列表.是时候与他们connect并开始下载文件片段了！我们可以将过程分为几个步骤.

对于每个Peers我们要完成一下操作:

1. 与Peers启动TCP连接.这就像打个电话一样.
2. 完成双向BitTorrent 握手.“您好您好.”
3. 交换消息以下载片段.“请给我#231文件片.”

### 3.1 启动TCP连接

```go
conn, err := net.DialTimeout("tcp", peer.String(), 3*time.Second)
if err != nil {
    return nil, err
}
```

我设置了一个超时时间.这样我就不会在不会让我连接的Peer上浪费太多时间.
在大多数情况下.这是一个非常标准的TCP连接.

### 3.2 完成握手

我们刚刚建立了与Peer的连接.但是我们想进行一次握手以验证我们Peer

- 可以使用BitTorrent协议进行通讯
- 能够理解并回复我们的信息
- 拥有我们想要的文件.或者至少知道我们在说什么

![](/assets/image/golang_torrent_07.png)

父亲告诉我.握手的秘诀是有牢固握力和目光接触.良好的BitTorrent握手的秘诀在于它由五个部分组成：

1. 协议标识符的长度.始终为19 byte（十六进制为0x13)
1. 协议标识符.称为pstr.始终为BitTorrent protocol
1. 八个保留字节.都设置为0.我们会将其中一些翻转为1.以表示我们支持某些扩展.但是我们没有.所以我们将它们保持为0.
1. 我们之前计算出的信息哈希值.用于确定所需的文件
1. 我们用来识别自己的Peer ID

放在一起.握手字符串可能如下所示：

```go
\x13BitTorrent protocol\x00\x00\x00\x00\x00\x00\x00\x00\x86\xd4\xc8\x00\x24\xa4\x69\xbe\x4c\x50\xbc\x5a\x10\x2c\xf7\x17\x80\x31\x00\x74-TR2940-k8hj0wgej6ch
```

向Peers发送一次握手后.我们应该以相同的格式收到一次握手.
我们返回的信息哈希应该与发送的信息哈希匹配.
这样我们就知道我们在谈论同一文件.
如果一切都按计划进行.我们很好.如果没有.
我们可以切断连接.因为出了点问题.“您好？”“这是谁？您想要什么？”“好吧.哇.号码错误.”

在我们的代码中.让我们构造一个表示握手的结构.并编写一些用于序列化和读取它们的方法：

```go
// A Handshake is a special message that a peer uses to identify itself
type Handshake struct {
    Pstr     string
    InfoHash [20]byte
    PeerID   [20]byte
}

// Serialize serializes the handshake to a buffer
func (h *Handshake) Serialize() []byte {
    pstrlen := len(h.Pstr)
    bufLen := 49 + pstrlen
    buf := make([]byte, bufLen)
    buf[0] = byte(pstrlen)
    copy(buf[1:], h.Pstr)
    // Leave 8 reserved bytes
    copy(buf[1+pstrlen+8:], h.InfoHash[:])
    copy(buf[1+pstrlen+8+20:], h.PeerID[:])
    return buf
}

// Read parses a handshake from a stream
func Read(r io.Reader) (*Handshake, error) {
    // Do Serialize(), but backwards
    // ...
}
```

### 3.3 发送和接收消息

完成初始握手后.我们可以发送和接收消息.
好吧.不完全是.如果对方没有准备好接受消息.
那么在他们告诉我们他们已经准备好之前,我们无法发送任何消息.
在这种状态下.我们被其他`Peer` 认为`choked`.
他们会向我们发送一条unchoke锁定的消息.
让我们知道可以开始向他们询问数据了.
默认情况下.我们假设在没有其他证明之前被choked.

取消锁定后.我们就可以开始发送文件片段请求.他们可以向我们发送包含文件片段的消息.

![](/assets/image/golang_torrent_08.png)

#### 3.3.1 解释消息

消息具有长度.ID和payload. 它看起来像：

![](/assets/image/golang_torrent_09.png)

一条消息以长度指示符开头.该指示符告诉我们该消息将有多少字节长.它是一个32位整数.
意味着它是由四个byte按序排列的字节组成.下一个字节.即ID.告诉我们正在接收的Message Type.例如.一个`2`字节表示“感兴趣”.
最后.可选的有效payload将填充消息的剩余长度.

```go
type messageID uint8

const (
    MsgChoke         messageID = 0
    MsgUnchoke       messageID = 1
    MsgInterested    messageID = 2
    MsgNotInterested messageID = 3
    MsgHave          messageID = 4
    MsgBitfield      messageID = 5
    MsgRequest       messageID = 6
    MsgPiece         messageID = 7
    MsgCancel        messageID = 8
)

// Message stores ID and payload of a message
type Message struct {
    ID      messageID
    Payload []byte
}

// Serialize serializes a message into a buffer of the form
// <length prefix><message ID><payload>
// Interprets `nil` as a keep-alive message
func (m *Message) Serialize() []byte {
    if m == nil {
        return make([]byte, 4)
    }
    length := uint32(len(m.Payload) + 1) // +1 for id
    buf := make([]byte, 4+length)
    binary.BigEndian.PutUint32(buf[0:4], length)
    buf[4] = byte(m.ID)
    copy(buf[5:], m.Payload)
    return buf
}
```

要从流中读取消息.我们仅遵循消息的格式.我们读取四个字节并将其解释为uint32以获得Message Length.
然后.我们读取该字节数以获得ID（第一个字节)和有效payload（其余字节).

```go
// Read parses a message from a stream. Returns `nil` on keep-alive message
func Read(r io.Reader) (*Message, error) {
    lengthBuf := make([]byte, 4)
    _, err := io.ReadFull(r, lengthBuf)
    if err != nil {
        return nil, err
    }
    length := binary.BigEndian.Uint32(lengthBuf)

    // keep-alive message
    if length == 0 {
        return nil, nil
    }

    messageBuf := make([]byte, length)
    _, err = io.ReadFull(r, messageBuf)
    if err != nil {
        return nil, err
    }

    m := Message{
        ID:      messageID(messageBuf[0]),
        Payload: messageBuf[1:],
    }

    return &m, nil
}

```

#### 3.3.2 Bitfields

消息中最有趣的一种类型是bitfield.它是Peer用来有效编码他们能够发送给我们,告诉哪些文件片段的数据可以发送(下载完成).Bitfields看起来像一个byte数组.
要检查它们具有哪些部分.
我们只需要查看设置为1 的位的位置即可.您可以将其视为咖啡店会员打点卡.我们从所有的空白卡开始0.然后翻转位以1将其位置标记为“盖章”.

![](/assets/image/golang_torrent_10.png)

通过使用bit而不是byte.此数据结构非常紧凑.
我们可以在一个字节的空间（a的大小)中填充有关八段的信息bool.
代价就是访问这些值变得有些棘手.计算机可以寻址的最小内存单位是字节.因此要获取位.我们必须进行一些位运算操作：

```go
// A Bitfield represents the pieces that a peer has
type Bitfield []byte

// HasPiece tells if a bitfield has a particular index set
func (bf Bitfield) HasPiece(index int) bool {
    byteIndex := index / 8
    offset := index % 8
    return bf[byteIndex]>>(7-offset)&1 != 0
}

// SetPiece sets a bit in the bitfield
func (bf Bitfield) SetPiece(index int) {
    byteIndex := index / 8
    offset := index % 8
    bf[byteIndex] |= 1 << (7 - offset)
}
```

### 3.4 功能代码拼装

现在.我们拥有下载torrent所需的所有工具：我们具有从Tracker服务器获得的Peers的列表.并且可以通过拨打TCP连接.发起握手以及发送和接收消息来与它们进行通信.
我们的最后一个大问题是处理与多个Peers通讯所涉及的并发性.
以及在与Peers交互时管理Peers的状态.这些都是经典的难题.

#### 3.4.1 管理并发：chan作为队列

在Go中.我们通过通信共享内存.我们可以将Go channel 视为便宜的线程安全队列.

我们将建立两个 channel 来同步我们的并发worker：一个用于在Peers之间分发工作（文件片段下载).另一个用于收集下载的文件片段.
当下载的片段通过result channel 进入时.我们可以将它们复制到缓冲区中以开始组装完整的文件.

```go
// Init queues for workers to retrieve work and send results
workQueue := make(chan *pieceWork, len(t.PieceHashes))
results := make(chan *pieceResult)
for index, hash := range t.PieceHashes {
    length := t.calculatePieceSize(index)
    workQueue <- &pieceWork{index, hash, length}
}

// Start workers
for _, peer := range t.Peers {
    go t.startDownloadWorker(peer, workQueue, results)
}

// Collect results into a buffer until full
buf := make([]byte, t.Length)
donePieces := 0
for donePieces < len(t.PieceHashes) {
    res := <-results
    begin, end := t.calculateBoundsForPiece(res.index)
    copy(buf[begin:end], res.buf)
    donePieces++
}
close(workQueue)
```

我们将为从Tracker服务器收到的每个Peer节点生成一个worker.它将与Peers连接并握手.
然后开始从中检索工作workQueue.尝试下载该工作.然后将已下载的片段发送回该results channel.

![](/assets/image/golang_torrent_11.png)

```go
func (t *Torrent) startDownloadWorker(peer peers.Peer, workQueue chan *pieceWork, results chan *pieceResult) {
    c, err := client.New(peer, t.PeerID, t.InfoHash)
    if err != nil {
        log.Printf("Could not handshake with %s. Disconnecting\n", peer.IP)
        return
    }
    defer c.Conn.Close()
    log.Printf("Completed handshake with %s\n", peer.IP)

    c.SendUnchoke()
    c.SendInterested()

    for pw := range workQueue {
        if !c.Bitfield.HasPiece(pw.index) {
            workQueue <- pw // Put piece back on the queue
            continue
        }

        // Download the piece
        buf, err := attemptDownloadPiece(c, pw)
        if err != nil {
            log.Println("Exiting", err)
            workQueue <- pw // Put piece back on the queue
            return
        }

        err = checkIntegrity(pw, buf)
        if err != nil {
            log.Printf("Piece #%d failed integrity check\n", pw.index)
            workQueue <- pw // Put piece back on the queue
            continue
        }

        c.SendHave(pw.index)
        results <- &pieceResult{pw.index, buf}
    }
}

```

#### 3.4.2 管理状态

我们将跟踪struct中的每个Peers.并在阅读消息时修改该struct.它将包括诸如从Peers那里下载了多少.从Peers那里请求了多少以及是否受阻的数据.
如果我们想进一步扩展.
可以将其形式化为 finite state machine.但是到目前为止,一个结构和一个开关已经足够了.

```go
type pieceProgress struct {
    index      int
    client     *client.Client
    buf        []byte
    downloaded int
    requested  int
    backlog    int
}

func (state *pieceProgress) readMessage() error {
    msg, err := state.client.Read() // this call blocks
    switch msg.ID {
    case message.MsgUnchoke:
        state.client.Choked = false
    case message.MsgChoke:
        state.client.Choked = true
    case message.MsgHave:
        index, err := message.ParseHave(msg)
        state.client.Bitfield.SetPiece(index)
    case message.MsgPiece:
        n, err := message.ParsePiece(state.index, state.buf, msg)
        state.downloaded += n
        state.backlog--
    }
    return nil
}
```

#### 3.4.3 是时候提出要求了！

文件,文件片段和文件片段哈希还没有完.我们可以将文件片段分解成blocks,block是piece的一部分.
我们可以通过block的index.blck中的字节offset和length来完全定义块.
当我们从同级请求数据时.实际上是在请求block.
一个块通常为16KB.这意味着一个256KB的块实际上可能需要16个请求,
如果Peers收到对大于16KB的块的请求.则应该切断该连接.
但是,根据我的经验,他们通常非常乐意满足最大128KB的请求.在更大的块尺寸下.
我的下载整体速度只有中等程度的提高,因此最好坚持使用规范.

#### 3.4.4 Pipelining

网络round-trips很昂贵.并且一个一个地请求每个块绝对会降低我们的下载性能.
因此.重要的是流水线我们的请求.以使我们保持一定数量的未完成请求.这样可以将我们的连接吞吐量提高一个数量级.

![](/assets/image/golang_torrent_12.png)

传统上.BitTorrent客户端将五个流水线请求排队.这就是我将要使用的值.
我发现增加它可以使下载速度提高一倍.较新的客户端使用自适应队列大小来更好地适应现代网络的速度和条件.
这绝对是一个值得调整的参数.对于将来的性能优化而言,这是一个hanging fruit 方向.

```go
// MaxBlockSize is the largest number of bytes a request can ask for
const MaxBlockSize = 16384

// MaxBacklog is the number of unfulfilled requests a client can have in its pipeline
const MaxBacklog = 5

func attemptDownloadPiece(c *client.Client, pw *pieceWork) ([]byte, error) {
    state := pieceProgress{
        index:  pw.index,
        client: c,
        buf:    make([]byte, pw.length),
    }

    // Setting a deadline helps get unresponsive peers unstuck.
    // 30 seconds is more than enough time to download a 262 KB piece
    c.Conn.SetDeadline(time.Now().Add(30 * time.Second))
    defer c.Conn.SetDeadline(time.Time{}) // Disable the deadline

    for state.downloaded < pw.length {
        // If unchoked, send requests until we have enough unfulfilled requests
        if !state.client.Choked {
            for state.backlog < MaxBacklog && state.requested < pw.length {
                blockSize := MaxBlockSize
                // Last block might be shorter than the typical block
                if pw.length-state.requested < blockSize {
                    blockSize = pw.length - state.requested
                }

                err := c.SendRequest(pw.index, state.requested, blockSize)
                if err != nil {
                    return nil, err
                }
                state.backlog++
                state.requested += blockSize
            }
        }

        err := state.readMessage()
        if err != nil {
            return nil, err
        }
    }

    return state.buf, nil
}
```

#### 3.4.5 main.go

这是一个简短的.我们快到了.

```go
package main

import (
    "log"
    "os"

    "github.com/veggiedefender/torrent-client/torrentfile"
)

func main() {
    inPath := os.Args[1]
    outPath := os.Args[2]

    tf, err := torrentfile.Open(inPath)
    if err != nil {
        log.Fatal(err)
    }

    err = tf.DownloadToFile(outPath)
    if err != nil {
        log.Fatal(err)
    }
}

```

## 4. 这不是全部

为简洁起见.我仅包含了一些重要的代码片段.
值得注意的是.我忽略了所有粘合代码,解析.单元测试以及构建字符的无聊部分.
如果您有兴趣.请查看我的[完整代码](https://github.com/veggiedefender/torrent-client).

## 5. 开发者文献

- [BitTorrent开发者技术文档](https://www.bittorrent.org/beps/bep_0000.html)
- [om/jackpal/bencode-go](https://github.com/jackpal/bencode-go)
- [原文博客](https://blog.jse.li/posts/torrent/)
- [源代地址](https://github.com/veggiedefender/torrent-client/)