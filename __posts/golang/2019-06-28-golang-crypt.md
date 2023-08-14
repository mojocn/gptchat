---
layout: post
title: Go进阶18:常用加密解密算法总结AES/DES/RSA/Sha1/Sha256/MD5
category: Golang
tags: Go进阶
description: 
keywords: 加密,解密,算法,AES/DES/RSA/Sha1MD5
date: 2020-04-04T13:19:54+08:00
score: 5.0
permalink: /go/golang-crypto
coverage: crypt_with_golang.jpg
published: true
---

## 0. 摘要

在项目开发过程中,当操作一些用户的隐私信息,诸如密码,帐户密钥等数据时,往往需要加密后可以在网上传输.这时,需要一些高效地,简单易用的加密算法加密数据,然后把加密后的数据存入数据库或进行其他操作;当需要读取数据时,把加密后的数据取出来,再通过算法解密.

## 1. 关于加密解密

当前我们项目中常用的加解密的方式无非三种.

- 对称加密, 加解密都使用的是同一个密钥, 其中的代表就是AES,DES
- 非对加解密, 加解密使用不同的密钥, 其中的代表就是RSA
- 签名算法, 如MD5,SHA1,HMAC等, 主要用于验证,防止信息被修改, 如：文件校验,数字签名,鉴权协议

### 1.1. Base64不是加密算法

它是一种数据编码方式,虽然是可逆的,但是它的编码方式是公开的,无所谓加密.本文也对Base64编码方式做了简要介绍.

## 2. AES

AES,即高级加密标准（Advanced Encryption Standard）,是一个对称分组密码算法,旨在取代DES成为广泛使用的标准.AES中常见的有三种解决方案,分别为AES-128,AES-192和AES-256.
AES加密过程涉及到4种操作：字节替代（SubBytes）,行移位（ShiftRows）,列混淆（MixColumns）和轮密钥加（AddRoundKey）.解密过程分别为对应的逆操作.由于每一步操作都是可逆的,按照相反的顺序进行解密即可恢复明文.加解密中每轮的密钥分别由初始密钥扩展得到.算法中16字节的明文,密文和轮密钥都以一个4x4的矩阵表示.
AES 有五种加密模式：电码本模式（Electronic Codebook Book (ECB)）,密码分组链接模式（Cipher Block Chaining (CBC)）,计算器模式（Counter (CTR)）,密码反馈模式（Cipher FeedBack (CFB)
）和输出反馈模式（Output FeedBack (OFB)）

```go
import (
    "bytes"
    "crypto/aes"
    "fmt"
    "crypto/cipher"
    "encoding/base64"
)

func main() {
    orig := "hello world"
    key := "123456781234567812345678"
    fmt.Println("原文：", orig)

    encryptCode := AesEncrypt(orig, key)
    fmt.Println("密文：" , encryptCode)

    decryptCode := AesDecrypt(encryptCode, key)
    fmt.Println("解密结果：", decryptCode)
}

func AesEncrypt(orig string, key string) string {
    // 转成字节数组
    origData := []byte(orig)
    k := []byte(key)

	// 分组秘钥
	block, err := aes.NewCipher(k)
	if err != nil {
		panic(fmt.Sprintf("key 长度必须 16/24/32长度: %s", err.Error()))
	}
    // 获取秘钥块的长度
    blockSize := block.BlockSize()
    // 补全码
    origData = PKCS7Padding(origData, blockSize)
    // 加密模式
    blockMode := cipher.NewCBCEncrypter(block, k[:blockSize])
    // 创建数组
    cryted := make([]byte, len(origData))
    // 加密
    blockMode.CryptBlocks(cryted, origData)
    //使用RawURLEncoding 不要使用StdEncoding
    //不要使用StdEncoding  放在url参数中回导致错误
    return base64.RawURLEncoding.EncodeToString(cryted)

}

func AesDecrypt(cryted string, key string) string {
    //使用RawURLEncoding 不要使用StdEncoding
    //不要使用StdEncoding  放在url参数中回导致错误
    crytedByte, _ := base64.RawURLEncoding.DecodeString(cryted)
    k := []byte(key)

	// 分组秘钥
	block, err := aes.NewCipher(k)
	if err != nil {
		panic(fmt.Sprintf("key 长度必须 16/24/32长度: %s", err.Error()))
	}
    // 获取秘钥块的长度
    blockSize := block.BlockSize()
    // 加密模式
    blockMode := cipher.NewCBCDecrypter(block, k[:blockSize])
    // 创建数组
    orig := make([]byte, len(crytedByte))
    // 解密
    blockMode.CryptBlocks(orig, crytedByte)
    // 去补全码
    orig = PKCS7UnPadding(orig)
    return string(orig)
}

//补码
func PKCS7Padding(ciphertext []byte, blocksize int) []byte {
    padding := blocksize - len(ciphertext)%blocksize
    padtext := bytes.Repeat([]byte{byte(padding)}, padding)
    return append(ciphertext, padtext...)
}

//去码
func PKCS7UnPadding(origData []byte) []byte {
    length := len(origData)
    unpadding := int(origData[length-1])
    return origData[:(length - unpadding)]
}

```

## 3. DES

DES是一种对称加密算法,又称为美国数据加密标准.DES加密时以64位分组对数据进行加密,加密和解密都使用的是同一个长度为64位的密钥,实际上只用到了其中的56位,密钥中的第8,16…64位用来作奇偶校验.DES有ECB（电子密码本）和CBC（加密块）等加密模式.
DES算法的安全性很高,目前除了穷举搜索破解外, 尚无更好的的办法来破解.其密钥长度越长,破解难度就越大.
填充和去填充函数.

```go
func ZeroPadding(ciphertext []byte, blockSize int) []byte {
    padding := blockSize - len(ciphertext)%blockSize
    padtext := bytes.Repeat([]byte{0}, padding)
    return append(ciphertext, padtext...)
}

func ZeroUnPadding(origData []byte) []byte {
    return bytes.TrimFunc(origData,
        func(r rune) bool {
            return r == rune(0)
        })
}
```

加密.

```go
func Encrypt(text string, key []byte) (string, error) {
    src := []byte(text)
    block, err := des.NewCipher(key)
    if err != nil {
        return "", err
    }
    bs := block.BlockSize()
    src = ZeroPadding(src, bs)
    if len(src)%bs != 0 {
        return "", errors.New("Need a multiple of the blocksize")
    }
    out := make([]byte, len(src))
    dst := out
    for len(src) > 0 {
        block.Encrypt(dst, src[:bs])
        src = src[bs:]
        dst = dst[bs:]
    }
    return hex.EncodeToString(out), nil
}
```

解密.

```go
func Decrypt(decrypted string , key []byte) (string, error) {
    src, err := hex.DecodeString(decrypted)
    if err != nil {
        return "", err
    }
    block, err := des.NewCipher(key)
    if err != nil {
        return "", err
    }
    out := make([]byte, len(src))
    dst := out
    bs := block.BlockSize()
    if len(src)%bs != 0 {
        return "", errors.New("crypto/cipher: input not full blocks")
    }
    for len(src) > 0 {
        block.Decrypt(dst, src[:bs])
        src = src[bs:]
        dst = dst[bs:]
    }
    out = ZeroUnPadding(out)
    return string(out), nil
}
```

测试.在这里,DES中使用的密钥key只能为8位.

```go
func main() {
    key := []byte("2fa6c1e9")
    str :="I love this beautiful world!"
    strEncrypted, err := Encrypt(str, key)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("Encrypted:", strEncrypted)
    strDecrypted, err := Decrypt(strEncrypted, key)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("Decrypted:", strDecrypted)
}
//Output:
//Encrypted: 5d2333b9fbbe5892379e6bcc25ffd1f3a51b6ffe4dc7af62beb28e1270d5daa1
//Decrypted: I love this beautiful world!
```

## 4. RSA

首先使用openssl生成公私钥,使用RSA的时候需要提供公钥和私钥 , 可以通过openss来生成对应的pem格式的公钥和私钥匙

```go

import (
    "crypto/rand"
    "crypto/rsa"
    "crypto/x509"
    "encoding/base64"
    "encoding/pem"
    "errors"
    "fmt"
)

// 私钥生成
//openssl genrsa -out rsa_private_key.pem 1024
var privateKey = []byte(`
-----BEGIN RSA PRIVATE KEY-----
MIICWwIBAAKBgQDcGsUIIAINHfRTdMmgGwLrjzfMNSrtgIf4EGsNaYwmC1GjF/bM
h0Mcm10oLhNrKNYCTTQVGGIxuc5heKd1gOzb7bdTnCDPPZ7oV7p1B9Pud+6zPaco
qDz2M24vHFWYY2FbIIJh8fHhKcfXNXOLovdVBE7Zy682X1+R1lRK8D+vmQIDAQAB
AoGAeWAZvz1HZExca5k/hpbeqV+0+VtobMgwMs96+U53BpO/VRzl8Cu3CpNyb7HY
64L9YQ+J5QgpPhqkgIO0dMu/0RIXsmhvr2gcxmKObcqT3JQ6S4rjHTln49I2sYTz
7JEH4TcplKjSjHyq5MhHfA+CV2/AB2BO6G8limu7SheXuvECQQDwOpZrZDeTOOBk
z1vercawd+J9ll/FZYttnrWYTI1sSF1sNfZ7dUXPyYPQFZ0LQ1bhZGmWBZ6a6wd9
R+PKlmJvAkEA6o32c/WEXxW2zeh18sOO4wqUiBYq3L3hFObhcsUAY8jfykQefW8q
yPuuL02jLIajFWd0itjvIrzWnVmoUuXydwJAXGLrvllIVkIlah+lATprkypH3Gyc
YFnxCTNkOzIVoXMjGp6WMFylgIfLPZdSUiaPnxby1FNM7987fh7Lp/m12QJAK9iL
2JNtwkSR3p305oOuAz0oFORn8MnB+KFMRaMT9pNHWk0vke0lB1sc7ZTKyvkEJW0o
eQgic9DvIYzwDUcU8wJAIkKROzuzLi9AvLnLUrSdI6998lmeYO9x7pwZPukz3era
zncjRK3pbVkv0KrKfczuJiRlZ7dUzVO0b6QJr8TRAA==
-----END RSA PRIVATE KEY-----
`)

// 公钥: 根据私钥生成
//openssl rsa -in rsa_private_key.pem -pubout -out rsa_public_key.pem
var publicKey = []byte(`
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDcGsUIIAINHfRTdMmgGwLrjzfM
NSrtgIf4EGsNaYwmC1GjF/bMh0Mcm10oLhNrKNYCTTQVGGIxuc5heKd1gOzb7bdT
nCDPPZ7oV7p1B9Pud+6zPacoqDz2M24vHFWYY2FbIIJh8fHhKcfXNXOLovdVBE7Z
y682X1+R1lRK8D+vmQIDAQAB
-----END PUBLIC KEY-----
`)

// 加密
func RsaEncrypt(origData []byte) ([]byte, error) {
    //解密pem格式的公钥
    block, _ := pem.Decode(publicKey)
    if block == nil {
        return nil, errors.New("public key error")
    }
    // 解析公钥
    pubInterface, err := x509.ParsePKIXPublicKey(block.Bytes)
    if err != nil {
        return nil, err
    }
    // 类型断言
    pub := pubInterface.(*rsa.PublicKey)
    //加密
    return rsa.EncryptPKCS1v15(rand.Reader, pub, origData)
}

// 解密
func RsaDecrypt(ciphertext []byte) ([]byte, error) {
    //解密
    block, _ := pem.Decode(privateKey)
    if block == nil {
        return nil, errors.New("private key error!")
    }
    //解析PKCS1格式的私钥
    priv, err := x509.ParsePKCS1PrivateKey(block.Bytes)
    if err != nil {
        return nil, err
    }
    // 解密
    return rsa.DecryptPKCS1v15(rand.Reader, priv, ciphertext)
}
func main() {
    data, _ := RsaEncrypt([]byte("hello world"))
    fmt.Println(base64.StdEncoding.EncodeToString(data))
    origData, _ := RsaDecrypt(data)
    fmt.Println(string(origData))
} 
```

## 5. 使用golang标准库ecdsa生成非对称(ES256,ES384,ES521)加密密钥对

```go
import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"github.com/spf13/cobra"
	"log"
	"os"
)


// ecdsaCmd represents the doc command
 func keyPairs(keyName string) {
    //elliptic.P256(),elliptic.P384(),elliptic.P521()

    privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
    if err != nil {
        log.Fatal(err)
    }
    x509Encoded, _ := x509.MarshalECPrivateKey(privateKey)
    privateBs := pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: x509Encoded})
    privateFile, err := os.Create(keyName + ".private.pem")
    if err != nil {
        log.Fatal(err)
    }
    _, err = privateFile.Write(privateBs)
    if err != nil {
        log.Fatal(err)
    }
    x509EncodedPub, _ := x509.MarshalPKIXPublicKey(privateKey.Public())
    publicBs := pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: x509EncodedPub})
    publicKeyFile, err := os.Create(keyName + ".public.pem")
    if err != nil {
        log.Fatal(err)
    }
    _, err = publicKeyFile.Write(publicBs)
    if err != nil {
        log.Fatal(err)
    }
}

```

## 6. MD5

MD5的全称是Message-DigestAlgorithm
5,它可以把一个任意长度的字节数组转换成一个定长的整数,并且这种转换是不可逆的.对于任意长度的数据,转换后的MD5值长度是固定的,而且MD5的转换操作很容易,只要原数据有一点点改动,转换后结果就会有很大的差异.正是由于MD5算法的这些特性,它经常用于对于一段信息产生信息摘要,以防止其被篡改.其还广泛就于操作系统的登录过程中的安全验证,比如Unix操作系统的密码就是经过MD5加密后存储到文件系统中,当用户登录时输入密码后,
对用户输入的数据经过MD5加密后与原来存储的密文信息比对,如果相同说明密码正确,否则输入的密码就是错误的.
MD5以512位为一个计算单位对数据进行分组,每一分组又被划分为16个32位的小组,经过一系列处理后,输出4个32位的小组,最后组成一个128位的哈希值.对处理的数据进行512求余得到N和一个余数,如果余数不为448,填充1和若干个0直到448位为止,最后再加上一个64位用来保存数据的长度,这样经过预处理后,数据变成（N+1）x
512位.
加密.Encode 函数用来加密数据,Check函数传入一个未加密的字符串和与加密后的数据,进行对比,如果正确就返回true.

```go
func Check(content, encrypted string) bool {
    return strings.EqualFold(Encode(content), encrypted)
}
func Encode(data string) string {
    h := md5.New()
    h.Write([]byte(data))
    return hex.EncodeToString(h.Sum(nil))
}
```

测试.

```go
func main() {
     strTest := "I love this beautiful world!"
    strEncrypted := "98b4fc4538115c4980a8b859ff3d27e1"
    fmt.Println(Check(strTest, strEncrypted))
}
//Output:
//true

Sha1

package main

import (
	"crypto/sha1"
	 "fmt"
)
func main() {
   s := "sha1 this string"
   //产生一个散列值得方式是 sha1.New(),sha1.Write(bytes),然后 sha1.Sum([]byte{}).这里我们从一个新的散列开始.
   h := sha1.New()
   //写入要处理的字节.如果是一个字符串,需要使用[]byte(s) 来强制转换成字节数组.
   h.Write([]byte(s))
   //这个用来得到最终的散列值的字符切片.Sum 的参数可以用来都现有的字符切片追加额外的字节切片：一般不需要要.
   bs := h.Sum(nil)
   //SHA1 值经常以 16 进制输出,例如在 git commit 中.使用%x 来将散列结果格式化为 16 进制字符串.
   fmt.Println(s)
   fmt.Printf("%x\n", bs)
}

```

## 7. SHA

#### SHA1

```go
package main

import (
    "crypto/sha1"
    "fmt"
)

func main() {
    s := "sha1 this string"

    h := sha1.New()

    h.Write([]byte(s))

    bs := h.Sum(nil)

    fmt.Println(s)
    fmt.Printf("%x\n", bs)
}
```

#### SHA256

```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "fmt"
)

func main() {

    secret := "mysecret"
    data := "data"
    fmt.Printf("Secret: %s Data: %s\n", secret, data)

    // Create a new HMAC by defining the hash type and the key (as byte array)
    h := hmac.New(sha256.New, []byte(secret))

    // Write Data to it
    h.Write([]byte(data))

    // Get result and encode as hexadecimal string
    sha := hex.EncodeToString(h.Sum(nil))

    fmt.Println("Result: " + sha)
}
```

## 8. Base64

Base64是一种任意二进制到文本字符串的编码方法,常用于在URL,Cookie,网页中传输少量二进制数据.
首先使用Base64编码需要一个含有64个字符的表,这个表由大小写字母,数字,+和/组成.采用Base64编码处理数据时,会把每三个字节共24位作为一个处理单元,再分为四组,每组6位,查表后获得相应的字符即编码后的字符串.编码后的字符串长32位,这样,经Base64编码后,原字符串增长1/3.如果要编码的数据不是3的倍数,最后会剩下一到两个字节,Base64编码中会采用\x00在处理单元后补全,编码后的字符串最后会加上一到两个 =
表示补了几个字节.

```go
const (
   base64Table = "IJjkKLMNO567PQX12RVW3YZaDEFGbcdefghiABCHlSTUmnopqrxyz04stuvw89+/"

)

var coder = base64.NewEncoding(base64Table)

func Base64Encode(src []byte) []byte {         //编码
   return []byte(coder.EncodeToString(src))
}

func Base64Decode(src []byte) ([]byte, error) {   //解码
   return coder.DecodeString(string(src))
}
```

