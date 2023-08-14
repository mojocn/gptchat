---
layout: post
title: Python教程01:词云Word Cloud微服务
category: Python
tags: Python教程 docker
keywords: Python教程,Py教程,词云,云词,word_cloud,docker
description:  Python教程,Py教程,词云,word_cloud,docker教程
permalink: /python/:title
coverage: python_word_cloud.jpg
date: 2019-09-20T10:15:54+08:00
---

## 1. 方案选择

在日常项目中要生成类似上图这样的云词图片.
这里有一个python库可以完美的解决生成云词图片 [https://github.com/amueller/word_cloud](https://github.com/amueller/word_cloud).
除了Python之外的语言没有找到成熟完美lib来实现功能.
如果跨语言调用这个库,确实很头疼.
接下来就介绍几种实现方案,

### 1.1 方案一:第三方付费API

直接调用付费的第三方HTTP API生成图片,
开发人员直接发送http请求.虽然调用简单,但是将来的API调用成本更是未知.
不能定制化返回的结果和图片细微的调整.

### 1.2 方案二:shell执行python word_cloud

其他语言通过shell执行 python app.py 这个方案,看起来很完美,
但是设计到很多shell环境变量python环境,pip依赖等问题,将来部署交互带来很大的坑.
在[stackoverflow上有一个php 执行python 代码的方案](https://stackoverflow.com/questions/19735250/running-a-python-script-from-php),
又是PHP扩展,优势参数传递,stdout...就够麻烦了.
其次返回的数据不是结果化的,和其他语言数据通讯比较麻烦.
系统侵入比较强,高度耦合.

### 1.3 方案三:Word Cloud + Flask + Docker微服务

工作的基本流程如下:

- word cloud 封装成Flask HTTP API
- 编写Dockerfile制作镜像
- 部署直接docker run, 其他语言通过HTTP 进行调用

优势:

1. 成本低廉
2. 部署简单
3. 调用方便
4. 耦合性低

这个方案也是我们最终选定的方案.

## 2. Python Flask服务构建

python pip依赖
1. gunicorn 常用的WSGI容器有Gunicorn和uWSGI,但Gunicorn直接用命令启动,不需要编写配置文件,相对uWSGI要容易很多,所以这里我也选择用Gunicorn作为容器
2. gevent 采用gevent库,支持异步处理请求,提高吞吐量
3. flask http框架
4. jieba 中文分词处理,让wordcloud支持中文
5. wordcloud 生成的词云图
6. numpy 图片处理
6. matplotlib 非常强大的 Python 画图工具

详解[requirements.txt](https://github.com/mojocn/wordCloudDocker/blob/master/code/requirements.txt)

gunicorn + gevent + flask 实现大并发服务.
Flask Http服务非常简单python代码不足一百行
接受Form Post请求参数content(文本内容) gender(man/woman)性别来确定使用mask图片,
同时还有debug参数来控制输出结果是base64图片还是图片响应.

云词API接口代码业务流程大概为:
1. 获取文本参数
2. 使用jieba做中文分词处理
3. 更具gender确定mask 图片
4. 调用wordcloud生成图片
5. 使用plt画布输出图片
6. plt画布图片输出到io.BytesIO()
7. io.BytesIO() base64转码
8. 拼接image/png + base64字符串

### 2.1 Flask app.py 核心代码

关于字体和mask图片的相对路径请查看项目目录结构:[项目地址mojocn/wordCloudDocker](https://github.com/mojocn/wordCloudDocker)

[code/app.py](https://github.com/mojocn/wordCloudDocker/blob/master/code/app.py)

```python
try:  # Python 3
    from urllib.parse import quote
except ImportError:  # Python 2
    from urllib import quote
import base64
import io
import os
import jieba
from flask import Flask, request, send_file
import numpy as np
from PIL import Image
from wordcloud import WordCloud

app = Flask(__name__)


@app.route('/api/word-cloud', methods=['POST'])
def word_cloud():
    d = app.root_path
    text = request.form['content']
    gender = request.form['gender']
    is_debug = request.form['debug']
    font = os.path.join(d, 'simhei.ttf')

    mask_path = os.path.join(d, "{}_mask.png".format(gender))
    mask_image = np.array(Image.open(mask_path))

    world_list_after_jieba = jieba.cut(text, cut_all=True)
    world_split = ' '.join(world_list_after_jieba)
    # contour color
    cc = "#FDD3D9"
    if gender == 'man':
        cc = "#C1DBFF"

    # 设置png 透明背景 background_color="rgba(255, 255, 255, 0)", mode="RGBA"      
    # https://github.com/amueller/word_cloud/issues/186
    wc = WordCloud(collocations=False, mask=mask_image, font_path=font, max_words=200, contour_width=1,
                   contour_color=cc, margin=0, background_color='white', width=252, height=668).generate(
        world_split)

    img = wc.to_image()
    output_buffer = io.BytesIO()
    img.save(output_buffer, format='png')

    if is_debug == '1':
        # image file response
        output_buffer.seek(0)
        return send_file(output_buffer, mimetype='image/png', attachment_filename='your.png', as_attachment=True)
    # base64 image string response
    binary_data = output_buffer.getvalue()
    base64_data = base64.b64encode(binary_data)
    image_64 = 'data:image/png;base64,' + quote(base64_data)
    return image_64


if __name__ == '__main__':
    app.run()

```

### 2.2 API文档

| 接口              | 说明                                |
|-----------------|-----------------------------------|
| API URI         | localhost:8111/api/word-cloud     |
| Content-Type    | 只支持Form表单                         |
| Method          | POST                              |
| Form表单参数content | 必须 分析文本内容                         |
| Form表单参数gender  | 必须 性别                             |
| Form表单参数debug   | 必须 1:响应文件 0:响应image/png base64字符串 |

## 3. Docker 微服务构建

### 3.1 Dockerfile 创建

我们使用 python 3.6 版本, 首先复制 code 目录到镜像,在使用 pip install 安装python依赖包,同时使用国内镜像源.
EXPOSE 8111 端口, CMD 容器启动的时候支持 `gunicorn app:app -c ./gunicorn.conf.py` 命令 启动gunicorn + gevent + Flask HTTP服务,
通过[gunicorn.conf.py](https://github.com/mojocn/wordCloudDocker/blob/master/code/gunicorn.conf.py),我们可以知道:

````yml
workers = 8    # 定义同时开启的处理请求的进程数量,根据网站流量适当调整
worker_class = "gevent"   # 采用gevent库,支持异步处理请求,提高吞吐量
bind = "0.0.0.0:8111" #绑定端口
````

看懂Dockerfile 之前您必须知道项目目录结构:[项目地址mojocn/wordCloudDocker](https://github.com/mojocn/wordCloudDocker)

```dockerfile
FROM python:3.6

ENV TIME_ZONE=${TIME_ZONE}

RUN mkdir /code \
    &&apt-get update \
    &&apt-get -y install freetds-dev \
    &&apt-get -y install unixodbc-dev
COPY code /code
RUN pip install -r /code/requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
WORKDIR /code

EXPOSE 8111

CMD ["gunicorn", "app:app", "-c", "./gunicorn.conf.py"]
```

### 3.2 Docker Build Run

我们可以使用一下命令编译docker image 和运行容器,对外暴露8111端口.
直接使用GitHub repo 创建image 同时镜像命名为wordcloud.

```bash
# 直接使用GitHub repo 创建image 同时镜像命名为wordcloud
docker build -t worldcloud https://github.com/mojocn/wordCloudDocker.git
# docker 启动容器
docker run -d -p 8111:8111 worldcloud
```

### 3.3 其他语言调用word cloud 微服务

这里我一PHP语言为例来使用php curl,介绍字母使用word cloud 词云微服务:

```php
 private static function createWordImage($person, \Illuminate\Support\Collection $msgs, $timeout = 60)
    {
        // 合并聊天记录
        $msgArray = $msgs->pluck('content')->toArray();
        $content = implode("   ", $msgArray);
        $gender = $person->sex == 0 ? 'man' : 'woman';

        //聊天记录作为缓存的key
        $kk = md5($content});
        $vvv = Cache::get($kk);
        if (!empty($vvv)) {
            return $vvv;
        }
        // curl 调用 http api
        // 读取微服务api url
        $url = env('word_cloud_api');
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, true);
        // 设置 post form 参数
        $debug = "0";
        $data = compact('content', 'gender','debug');

        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);

        if ($timeout > 0) {
            curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        }
        $result = curl_exec($ch);
        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        // 获取base64字符串到cache
        if ($httpcode != 200) {
            return null;
        }
        Cache::add($kk, $result, 1);
        return $result;
    }
```

最后 关于docker container 不同容器之间通讯,请参考 [容器互联](https://yeasy.gitbooks.io/docker_practice/content/network/linking.html)

## 4. 结束语

如果者个项目提出docker部分,他就是一个简单flask API服务.
但是配和docker 和 docker-compose 部署它就可以大大的减轻项目的耦合和部署难度,可以说这就是一个python词云的微服务.

### 4.1 参考文档

1. [word cloud 官方文档及Demo](https://amueller.github.io/word_cloud/)
2. [docker 和 docker compose 教程](https://yeasy.gitbooks.io/docker_practice/content/network/linking.html)
3. [Word Cloud Python 源代码](https://github.com/amueller/word_cloud)
4. [PHP 执行python代码](https://stackoverflow.com/questions/19735250/running-a-python-script-from-php)
5. [本文项目 wordCloudDocker](https://github.com/mojocn/wordCloudDocker)