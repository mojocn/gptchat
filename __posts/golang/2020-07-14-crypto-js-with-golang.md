---
layout: post
title: "Go进阶44:AES对称 Crypto-JS 加密和Go解密"
category: Golang
tags: Go进阶 
keywords: "golang crypto-js 数据交换"
description: "crypto-js golang 使用案例"
coverage: crypto_js.jpg
permalink: /go/:title
date: 2020-07-14T15:06:00+08:00
---

## 1. 背景

crypto-js前端库和后端进行交互,debug非常困难:
javascript crypto-js 中的 string -> []byte string -> 转hex string-> base64 string -> base64-url-encoding 没有golang 直观明了.
所以这里遗留了很多坑.

## 2.前端Javascript AES对称加密代码

首先请前端同学安装 `npm install crypto-js`

```js
    import CryptoJS from 'crypto-js'
    //msg 需要被对称加密的明文
    //key aes 对称加密的密钥  必须是16长度,为了和后端交互 key字符串必须是16进制字符串,否在给golang进行string -> []byte带来困难
    function aseEncrypt(msg, key) {
        key = PaddingLeft(key, 16);//保证key的长度为16byte,进行'0'补位
        key = CryptoJS.enc.Utf8.parse(key);
        // 加密结果返回的是CipherParams object类型
        // key 和 iv 使用同一个值
        var encrypted = CryptoJS.AES.encrypt(msg, key, {
            iv: key,
            mode: CryptoJS.mode.CBC,// CBC算法
            padding: CryptoJS.pad.Pkcs7 //使用pkcs7 进行padding 后端需要注意
        });
        // ciphertext是密文,toString()内传编码格式,比如Base64,这里用了16进制
        // 如果密文要放在 url的参数中 建议进行 base64-url-encoding 和 hex encoding, 不建议使用base64 encoding
        return  encrypted.ciphertext.toString(CryptoJS.enc.Hex)  //后端必须进行相反操作

    }
    // 确保key的长度,使用 0 字符来补位
    // length 建议 16 24 32
    function PaddingLeft(key, length){
        let  pkey= key.toString();
        let l = pkey.length;
        if (l < length) {
            pkey = new Array(length - l + 1).join('0') + pkey;
        }else if (l > length){
            pkey = pkey.slice(length);
        }
        return pkey;
    }
```

其他的加密方式大同小异,只需要注意padding,补位,编码(hex,base64,base64-url)

## 3.Go语言AES对称解密

```go
import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"fmt"
)
// Decrypt Golang解密
// ciphertext  important important 上面js的生成的密文进行了 hex.encoding 在这之前必须要进行 hex.Decoding
// 上面js代码最后返回的是16进制
// 所以收到的数据hexText还需要用hex.DecodeString(hexText)转一下,这里略了
func Decrypt(ciphertext, key []byte) ([]byte, error) {
	pkey := PaddingLeft(key, '0', 16)//和js的key补码方法一致

	block, err := aes.NewCipher(pkey) //选择加密算法
	if err != nil {
		return nil, fmt.Errorf("key 长度必须 16/24/32长度: %s", err)
	}
	blockModel := cipher.NewCBCDecrypter(block, pkey) //和前端代码对应:   mode: CryptoJS.mode.CBC,// CBC算法
	plantText := make([]byte, len(ciphertext))
	blockModel.CryptBlocks(plantText, ciphertext)
	plantText = PKCS7UnPadding(plantText) //和前端代码对应:  padding: CryptoJS.pad.Pkcs7 
	return plantText, nil
}

func PKCS7UnPadding(plantText []byte) []byte {
	length := len(plantText)
	unpadding := int(plantText[length-1])
	return plantText[:(length - unpadding)]
}
//这个方案必须和js的方法是一样的
func PaddingLeft(ori []byte, pad byte, length int) []byte {
	if len(ori) >= length {
		return ori[:length]
	}
	pads := bytes.Repeat([]byte{pad}, length-len(ori))
	return append(pads, ori...)
}
```

其他的加密方式大同小异,只需要注意padding,补位,编码(hex,base64,base64-url)

### 3.1 不要遗忘 hex.DecodeString

test case

```go
import (
	"encoding/hex"
	"testing"
)

func TestDecryptJs(t *testing.T) {
    //使用 hex.DecodeString 来解析 上面js中的hex编码的密文
    //前往不要遗忘
	bs,err := hex.DecodeString("58ca9ab31d3dfc511283e85c0fc6cd071a236abc91e5e2b7d8bcd65bb860313d")
	if err != nil {
		t.Errorf("DecryptJs() error = %v", err)
		return
	}
    //ABCDEF1234123412 使对称加密的密钥
	got, err := Decrypt(bs, []byte("ABCDEF1234123412"))
	if err != nil {
		t.Errorf("DecryptJs() error = %v", err)
		return
	}
	t.Log(string(got))
}
```

### 3.2 golang 实现上面JS AES 对称加密的代码

这个部分代码和上面Javascript 的AES加密代码完成相同的功能.

```go
import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"encoding/hex"
	"errors"
	"fmt"
)
func paddingLeft(ori []byte, pad byte, length int) []byte {
	if len(ori) >= length {
		return ori[:length]
	}
	pads := bytes.Repeat([]byte{pad}, length-len(ori))
	return append(pads, ori...)
}

func JsAesEncrypt(raw string, key string) (string, error) {
	origData := []byte(raw)
	// 转成字节数组
	if len(key) == 0 {
		return "", errors.New("key 不能为空")
	}
	k := paddingLeft([]byte(key), '0', 16)

	// 分组秘钥
	block, err := aes.NewCipher(k)
	if err != nil {
		return "", fmt.Errorf("填充秘钥key的16位,24,32分别对应AES-128, AES-192, or AES-256  key 长度必须 16/24/32长度: %s", err)
	}
	// 获取秘钥块的长度
	blockSize := block.BlockSize()
	// 补全码
	origData = pkcs7Padding(origData, blockSize)
	// 加密模式
	blockMode := cipher.NewCBCEncrypter(block, k)
	// 创建数组
	cryted := make([]byte, len(origData))
	// 加密
	blockMode.CryptBlocks(cryted, origData)
	//使用RawURLEncoding 不要使用StdEncoding
	//不要使用StdEncoding  放在url参数中会导致错误
	return hex.EncodeToString(cryted), nil
}

```

## 4. 结论

完整代码详解  [https://github.com/mojocn/base64Captcha/wiki/Javascrip-Golang-AES-Decrypt-Encrypt](https://github.com/mojocn/base64Captcha/wiki/Javascrip-Golang-AES-Decrypt-Encrypt)

crypto-js的加密解密,如果在javascript/node 比较好使用, 如果出现了不同语言中传输则需要注意,一些问题.

- url参数传输会被转译,建议使用base64-url-encoding 或 hex-encoding
- key 字符串建议使用 hex string (0~9,a-f)
- 注意js string 和 golang string/[]byte/[]rune 之间转换的坑