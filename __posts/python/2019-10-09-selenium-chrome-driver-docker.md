---
layout: post
title: "Python教程02: selenium-chrome-driver-网页截图微服务"
category: Python
tags: Python教程 docker
keywords: Python教程,selenium,chrome-driver,docker微服务
description:  Python教程,Py教程,selenium--chrome-driver-docker微服务
permalink: /python/:title
coverage: chrome_driver.png
date: 2019-10-09T10:15:54+08:00
---

## 1. selenium-chrome-driver有什么用处?

这是一个使用Docker容器为服务化的一个网页截图微服务的Python-Docker教程.
主要技术:

- Python Flask: 提供微服务API
- selenium: 是最广泛使用的开源Web UI（用户界面）自动化测试套件之一.这里我们就使用它强大的截图API
- Chrome+Chrome-driver: 提供网页渲染
- Docker: 快捷的软件依赖安装和部署

这篇文章的全部源代码 [https://github.com/mojocn/wordCloudDocker](https://github.com/mojocn/wordCloudDocker)

## 2. 为什么使用selenium + chrome-driver?

最开始的时候我选择的使用selenium + phantomjs. 后来尝试多次还是决定使用chrome + chrome-driver做为selenium的驱动.
原因有一下几点:

1. phantomjs 2018-03-04 开发者宣布停止开发支持,PhantomJS 2.1.1将会是已知最后的稳定版本.
2. phantomjs 2.1.1 我尝试在debian docker 镜像中安装总时报错,安装错误解决不了,导致我写Dockerfile的时候疼苦
3. chrome+chrome-driver 可以获取最好的浏览器兼容,安装相对与比较简单.
4. 如果在selenium中是用phantomsj python总是提示warning: phantomjs is deprecated

所以最终还是选择了chrome + chrome-driver 作为selenium的驱动,
但是在 debian docker 镜像中安装 chrome 和chrome-driver 因为GF墙的存在也是非常疼苦.
所以建议docker build的时候还是带上梯子.

## 3. 安装chrome 和 chrome-driver

下面安装chrome 和chrome-driver都已经可以直接执行,不需要使用决定路径.

### 3.1 安装chrome driver

执行在ubuntu系统中执行下面bash代码,安装最小的chrome-driver,因为墙的下载速度有可能很慢.

```bash
CHROMEDRIVER_VERSION=`curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE` && \
mkdir -p /opt/chromedriver-$CHROMEDRIVER_VERSION && \
curl -sS -o /tmp/chromedriver_linux64.zip http://chromedriver.storage.googleapis.com/$CHROMEDRIVER_VERSION/chromedriver_linux64.zip && \
unzip -qq /tmp/chromedriver_linux64.zip -d /opt/chromedriver-$CHROMEDRIVER_VERSION && \
rm /tmp/chromedriver_linux64.zip && \
chmod +x /opt/chromedriver-$CHROMEDRIVER_VERSION/chromedriver && \
ln -fs /opt/chromedriver-$CHROMEDRIVER_VERSION/chromedriver /usr/local/bin/chromedriver
```

### 3.2 安装 Install Chrome

因为墙的下载速度有可能很慢.

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install
```

## 4. python截图API业务代码部分

这一部分我将说明Flask 截图API function.
完整代码地址[/code/app.py](https://github.com/mojocn/wordCloudDocker/blob/master/code/app.py)

### 4.1 API handler获取参数和生成ULR对应unique唯一文件名,

```python
from selenium import webdriver
import os
import hashlib

@app.route('/ss', methods=['GET'])
def screenshot():
    id = request.args.get('i', "0")
    url = request.args.get('u', '')
    if not url.startswith('http'):
        return "url u 参数不是合法的URL地址"
    key = hashlib.md5(url.encode('utf-8')).hexdigest()
    screen_shot_dir = "/data/screen_shot"
    image_name = id+"_"+key + ".png"
    image_path = os.path.join(screen_shot_dir, image_name)
    ....
```

- 获取url和id参数,其中id参数是数据库主键,
- md5 url参数,md5参数的值有可能会重复
- md5值+id就可以避免文件名重复
- 得到保存图片的绝对路径

### 4.2 API handler 如果截图不存在启动selenium + chrome-driver 保存截图文件

```python
from selenium import webdriver
import os
import hashlib
....
    d = app.root_path
    if not os.path.isfile(image_path):
        chrome_options = webdriver.ChromeOptions()
        chrome_options.add_argument('--user-agent="Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1; Microsoft; Lumia 640 XL LTE) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Mobile Safari/537.36 Edge/12.10166"')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--window-size=1024,768')
        chrome_options.add_argument('lang=zh_CN.UTF-8')
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--disable-gpu')
        browser = webdriver.Chrome(chrome_options=chrome_options)
        browser.set_window_size(1024, 768)
        browser.get(url)
        time.sleep(2)
        if not browser.save_screenshot(image_path):
            image_path = os.path.join(d,'image_error.jpg')
        browser.close()
    return send_file(image_path, mimetype='image/png', attachment_filename=image_name, as_attachment=False)
```

设置chrome的启动参数,更多启动参数详解 [https://developers.google.com/web/updates/2017/04/headless-chrome](https://developers.google.com/web/updates/2017/04/headless-chrome):

- --no-sandbox: 设置不适用sandbox 降低内存消耗
- --user-agent: 设置user-agent
- --window-size=1024,768: 设置窗口大小
- --headless: 无头模式,系统中不出现窗口
- --disable-gpu 关闭GPU加速

如果截图不存在,就开始selenium chrome-driver 截图保存到当前路径.
Flask 做出图片响应Response.

## 5. API接口说明

| 接口            | 说明             |
|---------------|----------------|
| URI           | :8111/ss       |
| url-参数:u      | url截图网址        |
| url-参数:i      | id防止md5 url值重复 |
| HTTP-Response | image/png      |

## 6. Dockerfile 详解

[Dockerfile在线地址](https://github.com/mojocn/wordCloudDocker/blob/master/Dockerfile)

```dockerfile
FROM python:3.6
# 设置环境变脸
# 设置chrome的可执行程序PATH
ENV TIME_ZONE=${TIME_ZONE} \
    PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/opt/chrome
# 更换成国内源

COPY sources.list /etc/apt/china.sources.list

# 安装工具依赖
RUN mkdir /code \
    &&mv /etc/apt/sources.list /etc/apt/source.list.bak \
    &&mv /etc/apt/china.sources.list /etc/apt/sources.list\
    &&apt-get update \
    &&apt-get -y install freetds-dev  \
    &&apt-get -y install unixodbc-dev
# 给selenium chrome安装中文字体
# 方式chrome 截图中文出现方块,显示中文出错
RUN apt-get update \
    &&apt-get -y install xfonts-wqy ttf-wqy-microhei

# 安装chromedirver
# Install Chrome WebDriver
RUN CHROMEDRIVER_VERSION=`curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE` && \
    mkdir -p /opt/chromedriver-$CHROMEDRIVER_VERSION && \
    curl -sS -o /tmp/chromedriver_linux64.zip http://chromedriver.storage.googleapis.com/$CHROMEDRIVER_VERSION/chromedriver_linux64.zip && \
    unzip -qq /tmp/chromedriver_linux64.zip -d /opt/chromedriver-$CHROMEDRIVER_VERSION && \
    rm /tmp/chromedriver_linux64.zip && \
    chmod +x /opt/chromedriver-$CHROMEDRIVER_VERSION/chromedriver && \
    ln -fs /opt/chromedriver-$CHROMEDRIVER_VERSION/chromedriver /usr/local/bin/chromedriver

# 下载 Chrome deb
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
# 安装chrome浏览器
RUN dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install

# copy python 代码文件
COPY code /code

# pip 批量安装 python　package
# 使用国内源
RUN pip install -r /code/requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/

# 设置工作目录
WORKDIR /code
# 暴露端口
EXPOSE 8111

# 启动flask 
# 加载gunicorn 配置文件
CMD ["gunicorn", "app:app", "-c", "./gunicorn.conf.py"]
```

Dockerfile 完成工作内容如下:

1. 使用Python 3.6 镜像
2. 更换国内apt-get源
3. 安装chrome 需要的中文字体
4. 安装chrome浏览器和chrome-driver
5. pip 安装python 依赖
6. 使用gunicorn 启动Python Flask 程序

[linux 安装中文字体教程](http://blog.itpub.net/30327022/viewspace-2650727/)

### 6.1 Docker编译

全部代码地址 [](https://github.com/mojocn/wordCloudDocker.git)

```bash
docker build -t seleniumshot https://github.com/mojocn/wordCloudDocker.git
```

### 6.2 Docker run

挂载container volumne,
`/data/screen_shot` 用来保存selenium chrome-driver 的截图,
`/data/log` 用来保存 Python Flask 的日志,

```bash
docker run -d -p 8111:8111 \
-v /data/dir_of_selenium_image:/data/screen_shot \
 -v /data/dir_of_flask_log:/data/log \
seleniumshot
```

## 7. 相关浏览器截图教程

- [golang chrome-dp 网页截图教程](/2018/12/26/chromedp-tutorial-for-golang)
- [PHP phantomjs 网页截图教程](/2018/12/26/php-phantomjs-screen-shot)
- [golang phantomjs 网页截图教程](/2018/12/26/phantomjs-tutorial-in-golang)
- [Python Selenium Chome-driver 网页截图教程](/python/selenium-chrome-driver-docker)
