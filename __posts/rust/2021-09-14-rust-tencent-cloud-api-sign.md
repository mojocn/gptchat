---
layout: post 
title: "RustToy01-腾讯云DNSpod API签名封装"
category: Rust 
tags: CheatSheet 
keywords: 'rust cheatsheet' 
description: 'RUST 语言对DNSPod API 签名的封装' 
coverage: HMAC-Authentication-in-Web-API.png
permalink: /:categories/:title 
date: 2021-09-14T07:58:54+08:00
---

## 1. 前言

因为最近做一个SSL证书自动化申请的app, 需要使用到DNS txt记录做ownership验证.
公司DNS解析商主要使用的是DNSpod, 腾讯云虽然有完整的API文档,但是缺少RUST语言的SDK,
所以自己就实现了一个简单的DNSpod RUST API封装.

这个项目代码的用途:

1. 自己的DDNS,动态dns, 在家庭电脑中运行程序,动态的机械域名到家庭宽带IP
2. 开发自己的自动SSL证书程序,最终做到公司全部的证书无限制的更新
3. 根据腾讯云API,开发其他的SDK

## 2. RUST 依赖

主要使用的第三方库

- [reqwest](https://crates.io/crates/reqwest): 做http client 发送http请求
- [chrono](https://crates.io/crates/chrono): 处理时间相关事项
- [serde](https://crates.io/crates/serde): 处理struct json 序列化相关信息
- [tokio](https://crates.io/crates/tokio): 处理async相关信息

Cargo.toml

```toml
[package]
name = "tencentcloudsign"
version = "0.1.0"
authors = ["EricZhou <neochau@gmail.com>"]
edition = "2018"

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

[dependencies]
chrono = "0.4.19"
hex = "0.4.3"
hmac = "0.11.0"
reqwest = {version="0.11.4",features=["json"]}
serde = {version = "1.0.130",features = ["derive"]}
serde_json = "1.0.67"
sha2 = "0.9.8"
sha256 = "1.0.2"
tokio = { version = "1.11.0", features = ["full"] }
```

## 3. RUST 实现 HMAC Sha256

HMAC算法首先它是基于信息摘要算法的.目前主要集合了MD和SHA两大系列消息摘要算法.
其中MD系列的算法有HmacMD2,HmacMD4,HmacMD5三种算法；SHA系列的算法有HmacSHA1,HmacSHA224,HmacSHA256,HmacSHA384,HmacSHA512五种算法.

HMAC算法除了需要信息摘要算法外,还需要一个密钥.
HMAC的密钥可以是任何长度,如果密钥的长度超过了摘要算法信息分组的长度,则首先使用摘要算法计算密钥的摘要作为新的密钥.
一般不建议使用太短的密钥,因为密钥的长度与安全强度是相关的.通常选取密钥长度不小于所选用摘要算法输出的信息摘要的长度.

SHA256是SHA-2下细分出的一种算法.SHA-2（安全哈希算法2）是由美国国家安全局（NSA）设计的一组加密哈希函数.
SHA256其实就是一个哈希函数.哈希函数,又称散列算法,是一种从任何一种数据中创建小的数字“指纹”的方法.散列函数把消息或数据压缩成摘要,使得数据量变小,将数据的格式固定下来.
该函数将数据打乱混合,重新创建一个叫做散列值（或哈希值）的指纹.散列值通常用一个短的随机字母和数字组成的字符串来代表.

```rust
use hex;
use hmac::{Hmac, Mac, NewMac};
use sha2::Sha256;
use std::convert::TryInto;

pub fn hmac_sha256_hex(message: &[u8], key: &[u8]) -> String {
    type HmacSha256 = Hmac<Sha256>;
    let mut mac = HmacSha256::new_from_slice(key).expect("HMAC can take key of any size");
    mac.update(message);
    let result = mac.finalize();
    let code_bytes = result.into_bytes();
    let code_slice = code_bytes.as_slice();
    hex::encode(code_slice)
}

pub fn hmac_sha256(message: &[u8], key: &[u8]) -> [u8; 32] {
    type HmacSha256 = Hmac<Sha256>;
    let mut mac = HmacSha256::new_from_slice(key).expect("HMAC can take key of any size");
    mac.update(message);
    let result = mac.finalize();

    let code_bytes = result.into_bytes();
    let code_slice = code_bytes.as_slice();
    code_slice.try_into().expect("slice with incorrect length")
}


```

## 4. RUST DNSPod 签名方法 v3

[文档中心 > DNSPod > API 文档 > 调用方式 > 签名方法 v3](https://cloud.tencent.com/document/product/1427/56189)

下类代码签名代码参照golang实现,并且实现和golang版本代码进行对照测试.

- `pub async fn send_request<T: DeserializeOwned, P: Serialize>`  对 `reqwest` 进行封装
- `fn make_timestamp_auth` 获取签名和时间戳

```rust
use chrono;
use reqwest::Client;
use reqwest::Result;
use serde::de::DeserializeOwned;
use serde::Serialize;
use sha256;

pub struct TencentCloudClient {
    ak: String,
    sk: String,
    host: String,
    service: String,
    region: String,
    version: String,
}
impl TencentCloudClient {
    pub fn new(ak: &str, sk: &str) -> Self {
        TencentCloudClient {
            ak: ak.to_string(),
            sk: sk.to_string(),
            host: "dnspod.tencentcloudapi.com".to_string(),
            service: "dnspod".to_string(),
            region: "".to_string(),
            version: "2021-03-23".to_string(),
        }
    }
    pub async fn send_request<T: DeserializeOwned, P: Serialize>(
        &self,
        method: &str,
        action: &str,
        query_without_question_mark: &str,
        body_obj: P,
    ) -> Result<T> {
        let body = serde_json::to_string(&body_obj).unwrap();

        let (ts, authorization) =
            self.make_timestamp_auth(method, query_without_question_mark, body.as_str());

        let url = format!("https://{}?{}", self.host, query_without_question_mark);

        let response = Client::new()
            .request(
                reqwest::Method::from_bytes(method.as_bytes()).unwrap(),
                reqwest::Url::parse(url.as_str()).expect("not a valid url"),
            )
            .header("Authorization", authorization)
            .header("Content-Type", "application/json; charset=utf-8")
            .header("Host", self.host.as_str())
            .header("X-TC-Action", action)
            .header("X-TC-Timestamp", ts.to_string().as_str())
            .header("X-TC-Version", self.version.as_str())
            .header("X-TC-Region", self.region.as_str())
            .body(body)
            .send()
            .await?;
        response.json().await
    }


    fn make_timestamp_auth(
        &self,
        method: &str,
        query_without_question_mark: &str,
        body: &str,
    ) -> (i64, String) {
        let content_type_json = "content-type:application/json";
        //https://cloud.tencent.com/document/product/1427/56189#Golang

        let algorithm = "TC3-HMAC-SHA256";
        let canonical_uri = "/";
        let canonical_headers =
            format!("{}; charset=utf-8\nhost:{}\n", content_type_json, self.host);

        let signed_headers = "content-type;host";
        let mut hashed_request_payload = sha256::digest("");
        if method == "POST" {
            hashed_request_payload = sha256::digest(body);
            //对于 GET 请求,RequestPayload 固定为空字符串.此示例计算结果是 35e9c5b0e3ae67532d3c9f17ead6c90222632e5b1ff7f6e89887f1398934f064.
        }
        let canonical_request = format!(
            "{}\n{}\n{}\n{}\n{}\n{}",
            method,
            canonical_uri,
            query_without_question_mark,
            canonical_headers,
            signed_headers,
            hashed_request_payload,
        );
        //println!("canonical_request        {}", canonical_request);

        // step 2: build string to sign
        //let now = chrono::Utc.ymd(2021, 7, 29).and_hms(12, 12, 12);

        let now = chrono::Utc::now();
        let timestamp = now.timestamp();
        //println!("ts:    {}", timestamp);

        let date = now.format("%Y-%m-%d").to_string();
        let credential_scope = format!("{}/{}/tc3_request", date, self.service);
        let hashed_canonical_request = sha256::digest(canonical_request);
        let string2sign = format!(
            "{}\n{}\n{}\n{}",
            algorithm, timestamp, credential_scope, hashed_canonical_request
        );

        //println!("string2sign               {}", string2sign);

        // step 3: sign string
        let secret_date = super::util::hmac_sha256(
            date.as_str().as_bytes(),
            format!("TC3{}", self.sk).as_str().as_bytes(),
        );

        let secret_service = super::util::hmac_sha256(self.service.as_bytes(), &secret_date);
        let secret_signing = super::util::hmac_sha256("tc3_request".as_bytes(), &secret_service);
        let signature =
            super::util::hmac_sha256_hex(string2sign.as_str().as_bytes(), &secret_signing);
        //println!("signature           {}", signature);

        // step 4: build authorization
        let authorization = format!(
            "{} Credential={}/{}, SignedHeaders={}, Signature={}",
            algorithm, self.ak, credential_scope, signed_headers, signature
        );
        (timestamp, authorization)
    }
}

#[cfg(test)]
mod tests {
    use super::super::model;
    use super::*;
    use tokio;


    #[tokio::test]
    async fn test_reqwest_json() {
        let ak = "your-tencent-ak";
        let sk = "your-tencent-sk";
        let arg = model::RecordArg {
            sub_domain: "ddddd2ds3".to_string(),
            domain: "libragen.cn".to_owned(),
            record_type: "TXT".to_owned(),
            record_line: "默认".to_owned(),
            value: "8.8.8.8".to_owned(),
        };
        //let payload = serde_json::to_string(&arg).expect("not valid json");
        //println!("arg === {}", payload);
        let s: model::ResResponseCreate = TencentCloudClient::new(ak, sk)
            .send_request("POST", "CreateRecord", "", arg)
            .await
            .expect("msg");

        println!("result === {:?}", serde_json::to_string_pretty(&s).unwrap());
    }
}


```

## 5. DNSPod需要的模型

模型定义相见文档 [文档中心 > DNSPod > API 文档 > DNSPod相关接口 > 批量添加记录](https://cloud.tencent.com/document/product/1427/56179)

- `#[derive(Serialize, Deserialize)]` 对腾讯云DNSPod json参数和返回值进行 struct 定义
- `#[serde(rename_all = "PascalCase")]` 字段 json 映射为PascalCase eg sub_domain ->  SubDomain

```rust
use serde;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct RecordArg {
    pub domain: String,
    pub sub_domain: String,
    pub record_type: String,
    pub record_line: String,
    pub value: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct ResResponseCreate {
    pub response: ResResponseCreateContent,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct ResResponseCreateContent {
    pub error: Option<ResResponseError>,
    pub request_id: String,
    pub record_id: Option<i64>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct ResResponseError {
    pub code: Option<String>,
    pub message: Option<String>,
}

#[cfg(test)]
mod tests {
   use super::*;

    #[test]
    fn test_json_model() {
        let raw = r#"{"Response":{"Error":{"Code":"InvalidParameter.DomainRecordExist","Message":"记录已经存在,无需再次添加."},"RequestId":"311b7561-cc89-493e-8fce-151e39a2af97"}}"#;
        let _mode: ResResponseCreate = serde_json::from_str(raw).expect("msg");
        let raw = r#"{"Response":{"RecordId":891172194,"RequestId":"6d692211-98f2-4b33-ae7a-ac270386a450"}}"#;
        let _mode: ResResponseCreate = serde_json::from_str(raw).expect("msg");
    }
}

```

## 6. Rust main 调用实例代码

```rust
mod model;
mod txcloud;
mod util;

#[tokio::main]
async fn main() {
    let ak = "your_tencent_ak";
    let sk = "your_tencent_sk";

    //https://cloud.tencent.com/document/product/1427/56179
    let arg = model::RecordArg {
        sub_domain: "585".to_string(),
        domain: "libragen.cn".to_owned(),
        record_type: "TXT".to_owned(),
        record_line: "默认".to_owned(),
        value: "8.8.8.8".to_owned(),
    };

    let result_instance:model::ResResponseCreate = txcloud::TencentCloudClient::new(ak, sk)
        .send_request("POST", "CreateRecord", "", arg)
        .await
        .expect("msg");


    let payload = serde_json::to_string(&result_instance).expect("not valid json");

    println!("result === {:?}", payload);
}

```

最终输出结果为:

```shell
➜  tencentcloudsign git:(master) ✗ cargo run
   Compiling tencentcloudsign v0.1.0 (/codeRust/tencentcloudsign)
    Finished dev [unoptimized + debuginfo] target(s) in 3.11s
     Running `target/debug/tencentcloudsign`
result === "{\"Response\":{\"Error\":null,\"RequestId\":\"80dcaab0-ac7f-47c1-bbe6-206479ae8ed9\",\"RecordId\":906525604}}"
➜  tencentcloudsign git:(master) ✗ 
```

## 7. 源代码

[https://github.com/mojocn/tencentcloudsign](https://github.com/mojocn/tencentcloudsign)