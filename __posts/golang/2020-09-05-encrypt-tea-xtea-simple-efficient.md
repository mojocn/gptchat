---
layout: post
title: "Go进阶50:简单高效加密算法TEA"
category: Golang
tags: Go进阶 
keywords: Tiny Encryption Algorithm 对称加密算法 golang 代码,使用代码示例
description: TEA(Tiny Encryption Algorithm)是一种分组加密算法,它的实现非常简单,通常只需要很精短的几行代码 golang 代码详解,
coverage: tea_algorithm.jpg
permalink: /:categories/:title
date: 2020-09-05T13:04:54+08:00
---

## 1. 什么是TEA加密算法

TEA(Tiny Encryption Algorithm)是一种**简单高效**的加密算法,以加密解密速度快,实现**简单高效**著称.

这篇文章代码有点多,如果比较关心实用性请直接查看最后一章(`TEA加密算法的优势和使用案例`).

> 在安全学领域,TEA(Tiny Encryption Algorithm)是一种分组加密算法,它的实现非常简单,通常只需要很精短的几行代码.
> TEA 算法最初是由剑桥计算机实验室的 David Wheeler 和 Roger Needham 在 1994 年设计的.

> TEA算法使用64位的明文分组和128位的密钥,它使用Feistel分组加密框架,需要进行 64 轮迭代,尽管作者认为 32 轮已经足够了.该算法使用了一个神秘常数δ作为倍数,它来源于黄金比率,以保证每一轮加密都不相同.但δ的精确值似乎并不重要,这里
> TEA 把它定义为 δ=「(√5 - 1)231」(也就是程序中的 0×9E3779B9).

### 1.1 算法原理

TEA加密和解密时都使用一个常量值,这个常量值为0x9e3779b,
这个值是近似黄金分割率,注意,有些编程人员为了避免在程序中直接出现"mov变量,0x9e3779b",
以免被破解者直接搜索0x9e3779b这个常数得知使用TEA算法,所以有时会使用"sub变量,0x61C88647"代替"mov变量,0x9e3779b",0x61C88647=－(0x9e3779b).
TEA算法每一次可以操作64bit(8byte),采用128bit(16byte)作为key,算法采用迭代的形式,推荐的迭代轮数是64轮,最少32轮.

## 2. XTEA(TEAN)算法

XTEA - 块TEA的继任者的第一个版本,

> 之后 TEA 算法被发现存在缺陷,作为回应,设计者提出了一个 TEA 的升级版本——XTEA(有时也被称为“tean”).
> XTEA 跟 TEA 使用了相同的简单运算,但它采用了截然不同的顺序,为了阻止密钥表攻击,四个子密钥(在加密过程中,原 128 位的密钥被拆分为 4 个 32 位的子密钥)采用了一种不太正规的方式进行混合,但速度更慢了.

TEA的第三个版本XXTEA,发表于1998年,进一步提高了TEA算法的安全性.

## 3. TEA算法Golang代码

```go

import (
	"crypto/cipher"
	"encoding/binary"
	"errors"
)

const (
	// TEA BlockSize 单位byte
	BlockSize = 8

	// KeySize TEA 算法 Key的byte长度.
	KeySize = 16

	// delta is the TEA key schedule 常量.
	delta = 0x9e3779b9

	// numRounds TEA算法 round 标准常量.
	numRounds = 64
)

//tea TEA加密算法.
type tea struct {
	key    [16]byte
	rounds int
}

// NewCipher 加密算法构造器,使用标准rounds, key 长度必须是 16 byte
func NewCipher(key []byte) (cipher.Block, error) {
	return NewCipherWithRounds(key, numRounds)
}


// NewCipherWithRounds 加密算法构造器,key 长度必须是 16 byte
func NewCipherWithRounds(key []byte, rounds int) (cipher.Block, error) {
	if len(key) != 16 {
		return nil, errors.New("tea: incorrect key size")
	}

	if rounds&1 != 0 {
		return nil, errors.New("tea: odd number of rounds specified")
	}

	c := &tea{
		rounds: rounds,
	}
	copy(c.key[:], key)

	return c, nil
}


//BlockSize 返回TEA block size,结果为常量. 方法来满足package "crypto/cipher" 的 Block interface
func (*tea) BlockSize() int {
	return BlockSize
}


//Encrypt 使用t.key 来加密 src参数8byte buffer内容,密文保存在dst里面.
// 注意data的长度大于block, 在连续的block上调用encrypt是不安全的,应该使用 CBC crypto/cipher/cbc.go 那种方式来encrypt
func (t *tea) Encrypt(dst, src []byte) {
	e := binary.BigEndian
	v0, v1 := e.Uint32(src), e.Uint32(src[4:])
	k0, k1, k2, k3 := e.Uint32(t.key[0:]), e.Uint32(t.key[4:]), e.Uint32(t.key[8:]), e.Uint32(t.key[12:])

	sum := uint32(0)
	delta := uint32(delta)

	for i := 0; i < t.rounds/2; i++ {
		sum += delta
		v0 += ((v1 << 4) + k0) ^ (v1 + sum) ^ ((v1 >> 5) + k1)
		v1 += ((v0 << 4) + k2) ^ (v0 + sum) ^ ((v0 >> 5) + k3)
	}

	e.PutUint32(dst, v0)
	e.PutUint32(dst[4:], v1)
}


// Decrypt 使用t.key 来解密 src参数8byte buffer内容,明文保存在dst里面.
func (t *tea) Decrypt(dst, src []byte) {
	e := binary.BigEndian
	v0, v1 := e.Uint32(src), e.Uint32(src[4:])
	k0, k1, k2, k3 := e.Uint32(t.key[0:]), e.Uint32(t.key[4:]), e.Uint32(t.key[8:]), e.Uint32(t.key[12:])

	delta := uint32(delta)
	sum := delta * uint32(t.rounds/2) // in general, sum = delta * n

	for i := 0; i < t.rounds/2; i++ {
		v1 -= ((v0 << 4) + k2) ^ (v0 + sum) ^ ((v0 >> 5) + k3)
		v0 -= ((v1 << 4) + k0) ^ (v1 + sum) ^ ((v1 >> 5) + k1)
		sum -= delta
	}

	e.PutUint32(dst, v0)
	e.PutUint32(dst[4:], v1)
}
```

## 4. XTEA算法Golang代码

### block.go

```go

package xtea

// XTEA is based on 64 rounds.
const numRounds = 64


// blockToUint32 读取8 byte 边出 2个 uint32
func blockToUint32(src []byte) (uint32, uint32) {
	r0 := uint32(src[0])<<24 | uint32(src[1])<<16 | uint32(src[2])<<8 | uint32(src[3])
	r1 := uint32(src[4])<<24 | uint32(src[5])<<16 | uint32(src[6])<<8 | uint32(src[7])
	return r0, r1
}


//uint32ToBlock 2个 uint32 边出 8 bytes
func uint32ToBlock(v0, v1 uint32, dst []byte) {
	dst[0] = byte(v0 >> 24)
	dst[1] = byte(v0 >> 16)
	dst[2] = byte(v0 >> 8)
	dst[3] = byte(v0)
	dst[4] = byte(v1 >> 24)
	dst[5] = byte(v1 >> 16)
	dst[6] = byte(v1 >> 8)
	dst[7] = byte(v1 >> 0)
}

// encryptBlock 使用XTEA加密单个8 byte block
func encryptBlock(c *Cipher, dst, src []byte) {
	v0, v1 := blockToUint32(src)

	// Two rounds of XTEA applied per loop
	for i := 0; i < numRounds; {
		v0 += ((v1<<4 ^ v1>>5) + v1) ^ c.table[i]
		i++
		v1 += ((v0<<4 ^ v0>>5) + v0) ^ c.table[i]
		i++
	}

	uint32ToBlock(v0, v1, dst)
}

// decryptBlock 使用XTEA解密单个8 byte block
func decryptBlock(c *Cipher, dst, src []byte) {
	v0, v1 := blockToUint32(src)

	// Two rounds of XTEA applied per loop
	for i := numRounds; i > 0; {
		i--
		v1 -= ((v0<<4 ^ v0>>5) + v0) ^ c.table[i]
		i--
		v0 -= ((v1<<4 ^ v1>>5) + v1) ^ c.table[i]
	}

	uint32ToBlock(v0, v1, dst)
}
```

### cipher.go

```go
package xtea 

import "strconv"

// XTEA block size in bytes.
const BlockSize = 8

// A Cipher is an instance of an XTEA cipher using a particular key.
type Cipher struct {
	// table contains a series of precalculated values that are used each round.
	table [64]uint32
}
// KeySizeError 自定义错误
type KeySizeError int
// Error .
func (k KeySizeError) Error() string {
	return "crypto/xtea: invalid key size " + strconv.Itoa(int(k))
}

// NewCipher 构造器.
// key 只能长度 16 bytes.
func NewCipher(key []byte) (*Cipher, error) {
	k := len(key)
	switch k {
	default:
		return nil, KeySizeError(k)
	case 16:
		break
	}

	c := new(Cipher)
	initCipher(c, key)

	return c, nil
}

//BlockSize 返回XTEA block size,结果为常量. 方法来满足package "crypto/cipher" 的 Block interface
func (c *Cipher) BlockSize() int { return BlockSize }


// Encrypt 加密 src参数8byte buffer内容,明文保存在dst里面.
// 注意data的长度大于block, 在连续的block上调用encrypt是不安全的,应该使用 CBC crypto/cipher/cbc.go 那种方式来encrypt
func (c *Cipher) Encrypt(dst, src []byte) { encryptBlock(c, dst, src) }

// Decrypt decrypts the 8 byte buffer src using the key and stores the result in dst.
// Decrypt 使用t.key 来解密 src参数8byte buffer内容,明文保存在dst里面.

func (c *Cipher) Decrypt(dst, src []byte) { decryptBlock(c, dst, src) }

// initCipher 把key转换成计算好的table
func initCipher(c *Cipher, key []byte) {
	// Load the key into four uint32s
	var k [4]uint32
	for i := 0; i < len(k); i++ {
		j := i << 2 // Multiply by 4
		k[i] = uint32(key[j+0])<<24 | uint32(key[j+1])<<16 | uint32(key[j+2])<<8 | uint32(key[j+3])
	}

	// Precalculate the table
	const delta = 0x9E3779B9
	var sum uint32

	// Two rounds of XTEA applied per loop
	for i := 0; i < numRounds; {
		c.table[i] = sum + k[sum&3]
		i++
		sum += delta
		c.table[i] = sum + k[(sum>>11)&3]
		i++
	}
}
```

## 5. TEA加密算法的优势和使用案例

TEA(Tiny Encryption Algorithm)是一种**简单高效**的加密算法,以加密解密速度快,实现**简单高效**著称.
算法真的很简单,TEA算法每一次可以操作64-bit(8-byte),
采用128-bit(16-byte)作为key,算法采用迭代的形式,推荐的迭代轮数是64轮,最少32轮.

## 5.1 基本单元测试

```go

import (
	"bytes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"golang.org/x/crypto/tea"
	"golang.org/x/crypto/xtea"
	"io"
	"testing"
)

func TestTeaDemo(t *testing.T) {
	

	key := []byte("mojotv.cn.=.good")//长度必须为16byte
	c, err := tea.NewCipherWithRounds(key, 8)
	if err != nil {
		t.Fatal(err)
	}
	raw := []byte("mojotvcn")//长度必须为8byte
	dst := make([]byte,8)//长度必须为8byte
	c.Encrypt(dst,raw)
	raw2 := make([]byte,8)//长度必须为8byte
	c.Decrypt(raw2,dst[:])

	if !bytes.Equal(raw,raw2){
		t.Error("失败")
	}
	t.Log("验证成功")
}
func TestXteaDemo(t *testing.T) {

	key := []byte("mojotv.cn.=.good")//长度必须为16byte
	c, err := xtea.NewCipher(key)
	if err != nil {
		t.Fatal(err)
	}
	raw := []byte("mojotvcn")//长度必须为8byte
	dst := make([]byte,8)//长度必须为8byte
	c.Encrypt(dst,raw)
	raw2 := make([]byte,8)//长度必须为8byte
	c.Decrypt(raw2,dst[:])

	if !bytes.Equal(raw,raw2){
		t.Error("失败")
	}
	t.Log("xtea验证成功")
}
```

## 5.2 XTea和CBC Base64Url编码一起使用

TEA加密算法只需要把下面代码稍微修改一下即可.
[mojocn/alg-tea](https://github.com/mojocn/alg-tea/blob/master/tea_test.go)

```go

//使用PKCS7进行填充
func pKCS7Padding(ciphertext []byte, blockSize int) []byte {
	padding := blockSize - len(ciphertext) % blockSize
	padtext := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(ciphertext, padtext...)
}
//使用PKCS7进行填充 复原
func pKCS7UnPadding(origData []byte) []byte {
	length := len(origData)
	unpadding := int(origData[length-1])
	return origData[:(length - unpadding)]
}

//XteaCbcEncrypt key 长度必须为16 byte
func XteaCbcEncrypt(rawData,key []byte) ([]byte, error) {
		block, err := xtea.NewCipher(key)
	if err != nil {
		return nil,fmt.Errorf("key 只能为16bytes, %v",err)
	}

	//填充原文
	blockSize := block.BlockSize()
	rawData = pKCS7Padding(rawData, blockSize)
	//初始向量IV必须是唯一,但不需要保密
	cipherText := make([]byte,blockSize+len(rawData))
	//block大小 16
	iv := cipherText[:blockSize]
	if _, err := io.ReadFull(rand.Reader,iv); err != nil {
		panic(err)
	}

	//block大小和初始向量大小一定要一致
	mode := cipher.NewCBCEncrypter(block,iv)
	mode.CryptBlocks(cipherText[blockSize:],rawData)

	return cipherText, nil
}
//XteaCbcDecrypt key 长度必须为16 byte
func XteaCbcDecrypt(encryptData, key []byte) ([]byte,error) {
	block, err := xtea.NewCipher(key)
	if err != nil {
		return nil,fmt.Errorf("key 只能为16bytes, %v",err)
	}

	blockSize := block.BlockSize()

	if len(encryptData) < blockSize {
		return nil,errors.New("ciphertext too short")
	}
	iv := encryptData[:blockSize]
	encryptData = encryptData[blockSize:]

	// CBC mode always works in whole blocks.
	if len(encryptData)%blockSize != 0 {
		return nil,errors.New("ciphertext is not a multiple of the block size")
	}

	mode := cipher.NewCBCDecrypter(block, iv)

	// CryptBlocks can work in-place if the two arguments are the same.
	mode.CryptBlocks(encryptData, encryptData)
	//解填充
	encryptData = pKCS7UnPadding(encryptData)
	return encryptData,nil
}


func XteaB64urlEncrypt(rawData,key []byte) (string,error) {
	data, err:= XteaCbcEncrypt(rawData,key)
	if err != nil {
		return "",err
	}
	return base64.RawURLEncoding.EncodeToString(data),nil
}

func XteaB64urlDecrypt(rawData string,key []byte) (string,error) {
	data,err := base64.RawURLEncoding.DecodeString(rawData)
	if err != nil {
		return "",err
	}
	dnData,err := XteaCbcDecrypt(data,key)
	if err != nil {
		return "",err
	}
	return string(dnData),nil
}


func TestXteaCbcB64url(t *testing.T) {
	key := []byte("mojotv.cn.=.good")//长度必须为16byte
	raw := "mojotv.cn and golang are great friends" //可以是任意长度的 []byte
	ciper,err := XteaB64urlEncrypt([]byte(raw),key)
	if err != nil {
		t.Error("xtea cbc base64 url 加密失败",err)
		return
	}
	decrypt, err := XteaB64urlDecrypt(ciper, key)
	if err != nil {
		t.Error("xtea cbc base64 url 解密失败",err)
		return
	}
	if decrypt != raw {
		t.Error("解密结果不正确")
	}
}
```

[Github Action 单元测试执行结果](https://github.com/mojocn/alg-tea/runs/1074969486?check_suite_focus=true)

```go
=== RUN   TestTeaDemo
    tea_test.go:32: 验证成功
--- PASS: TestTeaDemo (0.00s)
=== RUN   TestXteaDemo
    tea_test.go:50: xtea验证成功
--- PASS: TestXteaDemo (0.00s)
=== RUN   TestXteaCbcB64url
--- PASS: TestXteaCbcB64url (0.00s)
PASS
ok  	mojotv.cn/flash	0.005s
```