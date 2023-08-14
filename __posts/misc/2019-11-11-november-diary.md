---
layout: post
title: "MISC:十一月:招聘-FixBug-电器维修"
category: Misc
tags: 动手
keywords: "浴霸维修分享,google 翻译API, 怎么招聘"
description: "浴霸维修分享,google 翻译API, 怎么招聘"
coverage: ifix.png
permalink: /misc/:title
date: 2019-11-11T17:07:45+08:00
---

很长时间没有写技术博客了,主要原因有以下几点:

1. 我现在写的SpringBoot2项目功能实现没有技术亮点
2. 空余时间忙着负责招聘Golang和前端的事情
3. Golang 项目现在处于维护解决bug阶段,没有好的创意.
4. 非技术文章不是我的专长

总结起来说没有好的代码创意和特色为我提供写作技术博客的素材.其次这段时间工作任务比较多和下班之后没有空余时间.

## 1. 关于招聘

我们部门大概要招聘5名前端和5名Golang后端, 在二线城市大概发了一周简历收到Golang后端10多份简历,8份前端简历.
从简历中的细节和面试时的回答可以对简历中的真实性进行甄别.

### 1.1 Golang后端招聘心得

1. 开发经验1~3年:甄别真实工作经验(学习demo)
1. Python/PHP转golang应聘者:看他语言技术功底,数据库,技术规范(RESTful/OAuth/JWT),Debug
2. 刚毕业大学生: 数据结构和算法
3. Golang 开发者: RPC/Channel/Goroutine/socket/io
4. 资深开发者: 技术博客/开源项目/代码规范/多语言混用,和他少谈业务和功能,多谈技术实现和细节

### 1.2 前端招聘

1. 开发经验1~2年:框架基本知识点, promise/css
2. 3~5年: 考察是否有真实从0搭建前端项目,/websocket/canvas
3. 甄别:工作年限/项目经历
4. 开源项目/技术博客

## 2. 关于翻译API

我的网站有hacknews的部分是每天机器自动爬去翻译成中文的. 之前的翻译都是用Youdao翻译的API(收费).
说一下这个翻译API的缺点:

1. 翻译API 文档不规范, 关于参数的sign这部分写的不不清楚, 没有golang demo代码,
2. 有道API 翻译经常更新 参数经常变动.
3. API 间歇性调用错误导致,翻译失败, 怀疑有道API直接爬取google translate API翻译结果.
4. API 参数sign 在golang中 string 不能直接转换成 []byte 需要转换从[]rune才能 解决API 报错
5. API 错误代码定义不清楚, 错误原因code也文档不详, 怀疑写这个API文档和开发API的程序员是一个混混程序员.

吐槽过后接下来就是干货

### 2.1 免费Google 翻译API

***无须翻墙***

Demo 翻译 url  `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-cn&dt=t&q=Worldwide observations confirm nearby ‘lensing’ exoplanet`

| 参数     | 类型        | 说明                                                    | 
|--------|-----------|-------------------------------------------------------|
| url    | GET       | `https://translate.googleapis.com/translate_a/single` | 
| client | url-query | 默认值(不要修改) `gtx`                                       | 
| sl     | url-query | 来源语言 `en` `zh-cn` 语言代码如下                              |
| tl     | url-query | 目标语言 `en` `zh-cn` 语言代码如下                              |
| dt     | url-query | 默认值(不要修改) `t`                                         |
| q      | url-query | 翻译的文本 建议先url-encode                                   |

golang 调用示示例代码

```go
import (
	"net/http"
)
func TranslateEn2Ch(text string) (string, error) {
	url := fmt.Sprintf("https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-cn&dt=t&q=%s",url.QueryEscape(text))
	resp,err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if err != nil {
		return "", err
	}
	bs,err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	//返回的json反序列化比较麻烦, 直接字符串拆解
	ss := string(bs)
	ss = strings.ReplaceAll(ss,"[","")
	ss = strings.ReplaceAll(ss,"]","")
	ss = strings.ReplaceAll(ss,"null,","")
	ss = strings.Trim(ss,`"`)
	ps := strings.Split(ss,`","`)
	return ps[0], nil
}
```

Google 翻译API参数语言代码

<table>
<thead>
<tr>
<th>语言</th>
<th>ISO-639-1 代码</th>
</tr>
</thead>

<tbody>
<tr>
<td>南非荷兰语</td>
<td>af</td>
</tr>
<tr>
<td>阿尔巴尼亚语</td>
<td>sq</td>
</tr>
<tr>
<td>阿姆哈拉语</td>
<td>am</td>
</tr>
<tr>
<td>阿拉伯语</td>
<td>ar</td>
</tr>
<tr>
<td>亚美尼亚语</td>
<td>hy</td>
</tr>
<tr>
<td>阿塞拜疆语</td>
<td>az</td>
</tr>
<tr>
<td>巴斯克语</td>
<td>eu</td>
</tr>
<tr>
<td>白俄罗斯语</td>
<td>be</td>
</tr>
<tr>
<td>孟加拉语</td>
<td>bn</td>
</tr>
<tr>
<td>波斯尼亚语</td>
<td>bs</td>
</tr>
<tr>
<td>保加利亚语</td>
<td>bg</td>
</tr>
<tr>
<td>加泰罗尼亚语</td>
<td>ca</td>
</tr>
<tr>
<td>宿务语</td>
<td>ceb (<a href="https://en.wikipedia.org/wiki/ISO_639-2" class="external">ISO-639-2</a>)</td>
</tr>
<tr>
<td>中文（简体）</td>
<td>zh-CN 或 zh (<a href="https://tools.ietf.org/html/bcp47" class="external">BCP-47</a>)</td>
</tr>
<tr>
<td>中文（繁体）</td>
<td>zh-TW (<a href="https://tools.ietf.org/html/bcp47" class="external">BCP-47</a>)</td>
</tr>
<tr>
<td>科西嘉语</td>
<td>co</td>
</tr>
<tr>
<td>克罗地亚语</td>
<td>hr</td>
</tr>
<tr>
<td>捷克语</td>
<td>cs</td>
</tr>
<tr>
<td>丹麦语</td>
<td>da</td>
</tr>
<tr>
<td>荷兰语</td>
<td>nl</td>
</tr>
<tr>
<td>英语</td>
<td>en</td>
</tr>
<tr>
<td>世界语</td>
<td>eo</td>
</tr>
<tr>
<td>爱沙尼亚语</td>
<td>et</td>
</tr>
<tr>
<td>芬兰语</td>
<td>fi</td>
</tr>
<tr>
<td>法语</td>
<td>fr</td>
</tr>
<tr>
<td>弗里斯兰语</td>
<td>fy</td>
</tr>
<tr>
<td>加利西亚语</td>
<td>gl</td>
</tr>
<tr>
<td>格鲁吉亚语</td>
<td>ka</td>
</tr>
<tr>
<td>德语</td>
<td>de</td>
</tr>
<tr>
<td>希腊语</td>
<td>el</td>
</tr>
<tr>
<td>古吉拉特语</td>
<td>gu</td>
</tr>
<tr>
<td>海地克里奥尔语</td>
<td>ht</td>
</tr>
<tr>
<td>豪萨语</td>
<td>ha</td>
</tr>
<tr>
<td>夏威夷语</td>
<td>haw (<a href="https://en.wikipedia.org/wiki/ISO_639-2" class="external">ISO-639-2</a>)</td>
</tr>
<tr>
<td>希伯来语</td>
<td>he 或 iw</td>
</tr>
<tr>
<td>印地语</td>
<td>hi</td>
</tr>
<tr>
<td>苗语</td>
<td>hmn (<a href="https://en.wikipedia.org/wiki/ISO_639-2" class="external">ISO-639-2</a>)</td>
</tr>
<tr>
<td>匈牙利语</td>
<td>hu</td>
</tr>
<tr>
<td>冰岛语</td>
<td>is</td>
</tr>
<tr>
<td>伊博语</td>
<td>ig</td>
</tr>
<tr>
<td>印度尼西亚语</td>
<td>id</td>
</tr>
<tr>
<td>爱尔兰语</td>
<td>ga</td>
</tr>
<tr>
<td>意大利语</td>
<td>it</td>
</tr>
<tr>
<td>日语</td>
<td>ja</td>
</tr>
<tr>
<td>爪哇语</td>
<td>jw</td>
</tr>
<tr>
<td>卡纳达语</td>
<td>kn</td>
</tr>
<tr>
<td>哈萨克语</td>
<td>kk</td>
</tr>
<tr>
<td>高棉文</td>
<td>km</td>
</tr>
<tr>
<td>韩语</td>
<td>ko</td>
</tr>
<tr>
<td>库尔德语</td>
<td>ku</td>
</tr>
<tr>
<td>吉尔吉斯语</td>
<td>ky</td>
</tr>
<tr>
<td>老挝语</td>
<td>lo</td>
</tr>
<tr>
<td>拉丁文</td>
<td>la</td>
</tr>
<tr>
<td>拉脱维亚语</td>
<td>lv</td>
</tr>
<tr>
<td>立陶宛语</td>
<td>lt</td>
</tr>
<tr>
<td>卢森堡语</td>
<td>lb</td>
</tr>
<tr>
<td>马其顿语</td>
<td>mk</td>
</tr>
<tr>
<td>马尔加什语</td>
<td>mg</td>
</tr>
<tr>
<td>马来语</td>
<td>ms</td>
</tr>
<tr>
<td>马拉雅拉姆文</td>
<td>ml</td>
</tr>
<tr>
<td>马耳他语</td>
<td>mt</td>
</tr>
<tr>
<td>毛利语</td>
<td>mi</td>
</tr>
<tr>
<td>马拉地语</td>
<td>mr</td>
</tr>
<tr>
<td>蒙古文</td>
<td>mn</td>
</tr>
<tr>
<td>缅甸语</td>
<td>my</td>
</tr>
<tr>
<td>尼泊尔语</td>
<td>ne</td>
</tr>
<tr>
<td>挪威语</td>
<td>no</td>
</tr>
<tr>
<td>尼杨扎语（齐切瓦语）</td>
<td>ny</td>
</tr>
<tr>
<td>普什图语</td>
<td>ps</td>
</tr>
<tr>
<td>波斯语</td>
<td>fa</td>
</tr>
<tr>
<td>波兰语</td>
<td>pl</td>
</tr>
<tr>
<td>葡萄牙语（葡萄牙,巴西）</td>
<td>pt</td>
</tr>
<tr>
<td>旁遮普语</td>
<td>pa</td>
</tr>
<tr>
<td>罗马尼亚语</td>
<td>ro</td>
</tr>
<tr>
<td>俄语</td>
<td>ru</td>
</tr>
<tr>
<td>萨摩亚语</td>
<td>sm</td>
</tr>
<tr>
<td>苏格兰盖尔语</td>
<td>gd</td>
</tr>
<tr>
<td>塞尔维亚语</td>
<td>sr</td>
</tr>
<tr>
<td>塞索托语</td>
<td>st</td>
</tr>
<tr>
<td>修纳语</td>
<td>sn</td>
</tr>
<tr>
<td>信德语</td>
<td>sd</td>
</tr>
<tr>
<td>僧伽罗语</td>
<td>si</td>
</tr>
<tr>
<td>斯洛伐克语</td>
<td>sk</td>
</tr>
<tr>
<td>斯洛文尼亚语</td>
<td>sl</td>
</tr>
<tr>
<td>索马里语</td>
<td>so</td>
</tr>
<tr>
<td>西班牙语</td>
<td>es</td>
</tr>
<tr>
<td>巽他语</td>
<td>su</td>
</tr>
<tr>
<td>斯瓦希里语</td>
<td>sw</td>
</tr>
<tr>
<td>瑞典语</td>
<td>sv</td>
</tr>
<tr>
<td>塔加路语（菲律宾语）</td>
<td>tl</td>
</tr>
<tr>
<td>塔吉克语</td>
<td>tg</td>
</tr>
<tr>
<td>泰米尔语</td>
<td>ta</td>
</tr>
<tr>
<td>泰卢固语</td>
<td>te</td>
</tr>
<tr>
<td>泰文</td>
<td>th</td>
</tr>
<tr>
<td>土耳其语</td>
<td>tr</td>
</tr>
<tr>
<td>乌克兰语</td>
<td>uk</td>
</tr>
<tr>
<td>乌尔都语</td>
<td>ur</td>
</tr>
<tr>
<td>乌兹别克语</td>
<td>uz</td>
</tr>
<tr>
<td>越南语</td>
<td>vi</td>
</tr>
<tr>
<td>威尔士语</td>
<td>cy</td>
</tr>
<tr>
<td>班图语</td>
<td>xh</td>
</tr>
<tr>
<td>意第绪语</td>
<td>yi</td>
</tr>
<tr>
<td>约鲁巴语</td>
<td>yo</td>
</tr>
<tr>
<td>祖鲁语</td>
<td>zu</td>
</tr>
</tbody>
</table>

## 3. 关于家庭电器维修

家里的浴霸和灯坏了好几盏, 前前后后我都修了好几次, 因为没有电工材料和工具灯原因,维修失败.
在老婆的几次唠叨下, 我终于在淘宝上买了一套电工工具, 找出了浴霸故障的原因,顺便把坏的灯都换了.

### 3.1 维修浴霸

恶补知识:

1. 怎么使用试电笔?
2. 怎么拆吕栅格?
3. 怎么防止触电?

Debug 流程

1. 使用吸盘(iphone 换屏幕送的) 在老虎钳的加持下, 依次粘贴天花栅格板四个角,用力下拉,就可以拆开天花栅格
2. 拆开浴霸旁片两面的栅格版, 使用试电笔干感应电线是否有电,排除了主线路接触不良问题
3. 手机拍照记录之前线路连接方式(预防开关面板功能次序错乱),拆行浴霸
4. 排除浴霸内部集线器接触不了.(浴霸制热功能非常简单,灯泡接上电线就可以发热,不像LED灯需要镇流器)
5. 拆开浴霸灯泡座.发现500W灯泡底座的线路被烧掉了. 竟然使用30%铜线70%铝线的设计,这样设计浴霸,使用3~5年一定会烧掉. 动手能力差的客户,又会被不良厂家收割一波
6. 没有这样的线材怎么办,使用电饭煲/豆浆机/电脑的线,剪开替代上.
7. 替代烧掉的底座线路,浴霸有开始工作
8. 按照手机拍照,恢复线路连接.

总结: 奸商故意使用直径小的劣质线材, 如果使用足够好的线材, 他们就不能再次收割消费者了. 其次浴霸的技术含量其实很低,浴霸灯泡接上220V电就可以直接亮,没有技术门槛.

### 3.2 LED灯维修

LED灯管坏,特征灯管有黑色圈, 淘宝上直接购买对应功率和对应尺寸的灯管(比实体店实惠).

镇流器坏, 需要一高试电笔检查. 淘宝购买. 不建议去实体店被宰.