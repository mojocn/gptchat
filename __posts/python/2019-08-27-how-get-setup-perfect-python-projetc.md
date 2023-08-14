---
layout: post
title: Python教程:如何建立完美自动化的Python-starter项目
category: Python
tags: [Python, 教程]
keywords: Python语言教程,项目初始化配置完美的开发玩具和自动测试lint,git-hook开发环境
description:  在开始一个新的Python项目时,很容易就从编码入手.花费少量时间用最好的工具配置项目,将节省大量时间,并带来愉快的编码体验
permalink: /tutorial/:title
coverage: python_best_practise.png
date: 2019-08-27T15:00:54+08:00
---

在开始一个新的Python项目时,很容易就从编码入手.花费少量时间用最好的工具配置项目,将节省大量时间,并带来愉快的编码体验.
在理想的编程环境中,依赖关系对于所有开发人员都是相同的,代码将被完美地格式化,禁止常见错误,并且测试将涵盖所有内容.此外,所有这些都将在每次提交时自动的帮您执行format/check.
在本文中,我将介绍如何设置一个理想编程环境.您可以按照步骤操作,也可以直接跳转到通过安装`pipx`和`pipenv`自动生成新项目,然后生成新项目.

首先我们创建一个新的项目:

```
mkdir best_practices
cd best_practices
```

## 1. Python命令行工具 pipx

`Pipx`是一个简洁有效的实用程序,允许快速安装python命令行工具.我们将用它来安装`pipenv`和`cookiecutter`.

```bash
python3 -m pip install --user pipx
python3 -m pipx ensurepath
```

## 2. 使用pipenv进行依赖管理

> Pipenv会自动为您的项目创建和管理virtualenv,当您安装/卸载package时,Pipenv自动的从Pipfile安装/卸载package.
> 它还生成了非常重要的Pipfile.lock.

知道您和您的同事正在使用相同的package版本是一个巨大的信心提升,Pipenv能够确保做到这一点.

```
pipx install pipenv
```

## 3. 使用black和isort进行代码格式化

使用Black格式化代码:
> Black是不妥协的Python代码格式化程序.通过使用它,您同意放弃对手动格式化细节的控制.
> 作为回报,Black为您提供速度,决定论和免于pycodestyle唠叨格式化的自由.您将为更重要的事情节省时间和精力.

> 无论您正在阅读的项目如何,Blackened代码看起来都是一样的.一段时间后,格式化变得透明,您可以专注于内容.

而isort排序import：
> sort您的python import.isort是一个Python实用程序/库,用于按字母顺序对import进行排序,并自动分成多个部分.

让我们使用pipenv作为开发依赖项来安装它们,这样它们就不会使部署混乱：

```bash
pipenv install black isort --dev

```

black和isort具有不兼容的默认选项,因此我们将覆盖isort配置,优先使用black配置.创建一个setup.cfg文件并添加此配置：

```toml
[isort]
multi_line_output=3
include_trailing_comma=True
force_grid_wrap=0
use_parentheses=True
line_length=88
```

我们可以运行这些工具：

```bash
pipenv run black
pipenv run isort
```

## 4. 遵循flake8的风格

Flake8确保我们的代码遵循PEP8中定义的标准.使用pipenv安装：

```bash
pipenv install flake8 --dev
```

就像isort一样,它需要一些配置才能与black配合使用.将此配置添加到setup.cfg：

```toml
[flake8]
ignore = E203, E266, E501, W503
max-line-length = 88
max-complexity = 18
select = B,C,E,F,W,T4
```

现在我们可以运行flake8了`pipenv run flake8`.

## 5. 使用mypy的静态类型检查器

Mypy是Python的可选静态类型检查器,旨在结合动态类型和静态类型的好处.
Mypy将Python的便利性与强大的类型系统和编译时类型检查相结合

在Python中使用类型需要一点点适应,但好处是巨大的

- 静态类型可以使程序更容易理解和维护
- 静态类型可以帮助您更早地发现错误,减少测试和调试
- 静态类型可以帮助您在代码投入生产之前找到难以发现的错误

```bash
pipenv install mypy --dev

```

默认情况下,Mypy将递归检查所有类型注释的import,这会导致库不包含这些注释时出错.我们需要将mypy配置为仅在我们的代码上运行,
并忽略没有类型注释的导入的任何错误.我们假设我们的代码存在于best_practices以下配置的包中.将此添加到setup.cfg：

```toml
[mypy]
files=best_practices,test
ignore_missing_imports=true
```

现在我们可以运行mypy：

```bash
pipenv run mypy
```

这里有一个[快速查询手册mypy](https://mypy.readthedocs.io/en/latest/cheat_sheet_py3.html)

## 6. 使用pytest和pytest-cov进行测试

使用pytest编写测试非常容易
`pipenv install pytest pytest-cov --dev`

以下是pytest网站的一个简单示例：

```python
# content of test_sample.py
def inc(x):
    return x + 1


def test_answer():
    assert inc(3) == 5
```

执行它：

```bash
 pipenv run pytest
=========================== test session starts ============================
platform linux -- Python 3.x.y, pytest-5.x.y, py-1.x.y, pluggy-0.x.y
cachedir: $PYTHON_PREFIX/.pytest_cache
rootdir: $REGENDOC_TMPDIR
collected 1 item

test_sample.py F                                                     [100%]

================================= FAILURES =================================
_______________________________ test_answer ________________________________

    def test_answer():
>       assert inc(3) == 5
E       assert 4 == 5
E        +  where 4 = inc(3)

test_sample.py:6: AssertionError
========================= 1 failed in 0.12 seconds ===================
```

我们所有的测试都应该放在test目录中,所以将此配置添加到setup.cfg：

```toml
[tool:pytest]
testpaths=test
```

我们还想检查测试涵盖了多少代码.创建一个新文件.coveragerc只返回我们的应用程序代码的coverage率统计信息,
我们再次假设我们的应用程序代码存在于best_practices模块中：

```python
[run]
source = best_practices

[report]
exclude_lines =
    # Have to re-enable the standard pragma
    pragma: no cover

    # Don't complain about missing debug-only code:
    def __repr__
    if self\.debug

    # Don't complain if tests don't hit defensive assertion code:
    raise AssertionError
    raise NotImplementedError

    # Don't complain if non-runnable code isn't run:
    if 0:
    if __name__ == .__main__.:
```

我们现在可以运行我们的测试并报告覆盖率 `pipenv run pytest --cov --cov-fail-under=100`

如果我们对应用程序代码的测试覆盖率低于100％,则会失败.

## 7. Git挂钩 pre-commit

Git钩子允许您在任何时候提交或推送时运行脚本.这使我们可以在每次提交/推送时自动运行所有的linting和test.pre-commit允许轻松配置这些钩子：

在提交代码审查之前,Git钩子脚本可用于识别简单问题.我们在每次提交时运行我们的钩子,以自动指出代码中的问题,

在这里,我们配置所有上述工具,以便在提交时在任何已更改的python文件上运行,并且仅在推送时运行pytest coverage,因为它可能很慢.
创建一个新文件`.pre-commit-config.yaml`：

```yaml
repos:
- repo: local
  hooks:
  - id: isort
    name: isort
    stages: [commit]
    language: system
    entry: pipenv run isort
    types: [python]

  - id: black
    name: black
    stages: [commit]
    language: system
    entry: pipenv run black
    types: [python]

  - id: flake8
    name: flake8
    stages: [commit]
    language: system
    entry: pipenv run flake8
    types: [python]
    exclude: setup.py

  - id: mypy
    name: mypy
    stages: [commit]
    language: system
    entry: pipenv run mypy
    types: [python]
    pass_filenames: false

  - id: pytest
    name: pytest
    stages: [commit]
    language: system
    entry: pipenv run pytest
    types: [python]

  - id: pytest-cov
    name: pytest
    stages: [push]
    language: system
    entry: pipenv run pytest --cov --cov-fail-under=100
    types: [python]
    pass_filenames: false
```

如果您需要跳过这些钩子,您可以运行`git commit --no-verify`或`git push --no-verify`

## 8. 使用cookiecutter生成项目

现在我们已经看到了理想项目包含的内容,我们可以将其***转换为模板***,以使用单个命令生成新项目：

`pipx run cookiecutter gh:sourceryai/python-best-practices-cookiecutter`

填写项目名称和repo名称,将为您生成项目.

要完成设置,请按照下列步骤操作：

```bash
# Enter project directory
cd <repo_name>

# Initialise git repo
git init

# Install dependencies
pipenv install --dev

# Setup pre-commit and pre-push hooks
pipenv run pre-commit install -t pre-commit
pipenv run pre-commit install -t pre-push
```

模板项目包含一个非常简单的Python文件和测试来试用这些工具.一旦您对代码感到满意,您就可以先完成代码,然后git commit运行所有的git hooks.
