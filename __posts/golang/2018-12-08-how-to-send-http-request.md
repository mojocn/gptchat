---
layout: post
title: go代码示例:发送http网络请求
category: Golang
tags: golang 网络请求
description: 使用go语言发送http网络请求 GET POST DELETE PUT PATCH,Golang发送Post/GET/Json/Authorization/token 自定义Header网络请求
keywords: 使用go语言发送http网络请求,Golang发送Post/GET/Json/Authorization/token 自定义Header网络请求 GET POST DELETE PUT PATCH
date: 2018-12-26T13:19:54+08:00
---

## POST JSON

```go
func main() {
    url := "http://restapi3.apiary.io/notes"
    fmt.Println("URL:>", url)
    //也可以使用marshall 一个struc map array ....
    var jsonStr = []byte(`{"title":"Buy cheese and bread for breakfast."}`)
    req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonStr))
    //自定义header
    //可以定义 cookie authorization
    req.Header.Set("X-Custom-Header", "myvalue")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    fmt.Println("response Status:", resp.Status)
    fmt.Println("response Headers:", resp.Header)
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println("response Body:", string(body))
}
```

## POST 表单和文件

```go
package main

import (
    "bytes"
    "fmt"
    "io"
    "mime/multipart"
    "net/http"
    "net/http/httptest"
    "net/http/httputil"
    "os"
    "strings"
)

func main() {

    var client *http.Client
    var remoteURL string
    {
        //setup a mocked http client.
        ts := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            b, err := httputil.DumpRequest(r, true)
            if err != nil {
                panic(err)
            }
            fmt.Printf("%s", b)
        }))
        defer ts.Close()
        client = ts.Client()
        remoteURL = ts.URL
    }

    //prepare the reader instances to encode
    values := map[string]io.Reader{
        "file":  mustOpen("main.go"), // lets assume its this file
        "other": strings.NewReader("hello world!"),
    }
    err := Upload(client, remoteURL, values)
    if err != nil {
        panic(err)
    }
}

func Upload(client *http.Client, url string, values map[string]io.Reader) (err error) {
    // Prepare a form that you will submit to that URL.
    var b bytes.Buffer
    w := multipart.NewWriter(&b)
    for key, r := range values {
        var fw io.Writer
        if x, ok := r.(io.Closer); ok {
            defer x.Close()
        }
        // 添加图片文件
        if x, ok := r.(*os.File); ok {
            if fw, err = w.CreateFormFile(key, x.Name()); err != nil {
                return
            }
        } else {
            // Add other fields
            if fw, err = w.CreateFormField(key); err != nil {
                return
            }
        }
        if _, err = io.Copy(fw, r); err != nil {
            return err
        }

    }
    // Don't forget to close the multipart writer.
    // If you don't close it, your request will be missing the terminating boundary.
    w.Close()

    // Now that you have a form, you can submit it to your handler.
    req, err := http.NewRequest("POST", url, &b)
    if err != nil {
        return
    }
    // Don't forget to set the content type, this will contain the boundary.
    req.Header.Set("Content-Type", w.FormDataContentType())

    // Submit the request
    res, err := client.Do(req)
    if err != nil {
        return
    }

    // Check the response
    if res.StatusCode != http.StatusOK {
        err = fmt.Errorf("bad status: %s", res.Status)
    }
    return
}

func mustOpen(f string) *os.File {
    r, err := os.Open(f)
    if err != nil {
        panic(err)
    }
    return r
}
```

## 更多的配置

```go
func httpDo() {
    client := &http.Client{}
    //可以使用 DELTE PUT PATCH HEAD GET POST
    req, err := http.NewRequest("POST", "https://mojotv.cn/demo/accept.json", strings.NewReader("name=mojotv.cn"))
    if err != nil {
        // handle error
    }
 
    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
    req.Header.Set("Cookie", "name=mojotv.cn")
 
    resp, err := client.Do(req)
 
    defer resp.Body.Close()
 
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        // handle error
    }
 
    fmt.Println(string(body))
}
```