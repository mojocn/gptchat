---
layout: post
title: python构建一个简单的推荐系统
category: Python
tags: Python
date: 2018-12-26T13:19:54+08:00
description: 本文将利用python构建一个简单的推荐系统,在此之前读者需要对pandas和numpy等数据分析包有所了解.
---

### 什么是推荐系统？

推荐系统的目的是通过发现数据集中的模式,为用户提供与之最为相关的信息.当您访问Netflix的时候,它也会为您推荐电影.音乐软件如Spotify及Deezer也使用推荐系统进行音乐推荐.

两名用户都在某电商网站购买了A,B两种产品.当他们产生购买这个动作的时候,两名用户之间的相似度便被计算了出来.其中一名用户除了购买了产品A和B,还购买了C产品,此时推荐系统会根据两名用户之间的相似度会为另一名用户推荐项目C.

### 推荐系统的主要分类

目前,主流的推荐系统包括基于内容的推荐以及协同过滤推荐.协同过滤简单来说就是根据用户对物品或者信息的偏好,发现物品或者内容本身的相关性,或者是发现用户的相关性,然后再基于这些关联性进行推荐.

举个简单的例子,如果要向个用户推荐一部电影,那么一定是基于他/她的朋友对这部电影的喜爱.基于协同过滤的推荐又可以分为两类：启发式推荐算法（Memory-based algorithms）及基于模型的推荐算法（Model-based
algorithms）.启发式推荐算法易于实现,并且推荐结果的可解释性强.启发式推荐算法又可以分为两类：

- 基于用户的协同过滤（User-based collaborative
  filtering）：主要考虑的是用户和用户之间的相似度,只要找出相似用户喜欢的物品,并预测目标用户对对应物品的评分,就可以找到评分最高的若干个物品推荐给用户.举个例子,Derrick和Dennis拥有相似的电影喜好,当新电影上映后,Derick对其表示喜欢,那么就能将这部电影推荐给Dennis.
- 基于项目的协同过滤（Item-based collaborative
  filtering）：主要考虑的是物品和物品之间的相似度,只有找到了目标用户对某些物品的评分,那么就可以对相似度高的类似物品进行预测,将评分最高的若干个相似物品推荐给用户.举个例子,如果用户A,B,C给书籍X,Y的评分都是5分,当用户D想要买Y书籍的时候,系统会为他推荐X书籍,因为基于用户A,B,C的评分,系统会认为喜欢Y书籍的人在很大程度上会喜欢X书籍.
  基于模型的推荐算法利用矩阵分解,有效的缓解了数据稀疏性的问题.矩阵分解是一种降低维度的方法,对特征进行提取,提高推荐准确度.基于模型的方法包括[决策树](),基于规则的模型,贝叶斯方法和潜在因素模型.

基于内容的推荐系统会使用到元数据,例如流派,制作人,演员,音乐家等来推荐电影或音乐.如果有人看过并喜欢范·迪塞尔主演的《速度与激情》,那么系统很有可能将他主演的另一部电影《无限战争》推荐给这些用户.同样,您也可以从某些艺术家那里得到音乐推荐.基于内容的推荐的思想是：如果您喜欢某样东西,您很可能会喜欢与之相似的东西.

### 数据集

我们将使用到MovieLes数据集,该数据集是关于电影评分的,由明尼苏达大学的Grouplens研究小组整理,分为1M,10M,20M三个规格.Movielens还有一个网站,可以注册,撰写评论并获取电影推荐.若不想用此数据集,您也可以从Dataquest的数据资源中找到更多用于各种数据科学任务的数据集.

### 推荐系统构建

我们将使用movielens构建一个基于项目相似度的推荐系统,首先导入pandas和numpy.

```
import pandas as pd 
import numpy as np
import warnings
warnings.filterwarnings('ignore')
```

接下来利用pandas中的read_csv()对数据进行加载.数据集中的数据以tab进行分隔,我们需要设置sep = t来指定字符的分隔符号,然后通过names参数传入列名.

```
df = pd.read_csv('u.data', sep='\t',names=['user_id','item_id','rating','titmestamp'])
```

接下来,检查正在处理的数据.

```
df.head()
```

相比只知道电影的ID,能看到它们的标题更为方便.接下来,下载电影的标题并将它们整合到数据集中.

```
movie_titles = pd.read_csv('Movie_Titles')
movie_titles.head()
```

因为item_id列是相同的,我们便可以在此列上对数据进行合并.

```
df = pd.merge(df, movie_titles, on='item_id')
df.head()
```

每列释义如下：

```
User_id：用户ID
Item_id：电影ID
Rating：用户给电影的评分,介于1到5分之间
Timestamp：对电影进行评分的时间点
Title：电影标题
```

使用description或info命令,可以得到数据集的简要描述,以帮助我们更好的理解数据集.

```
df.describe()
```

通过上一步,可以知道电影的平均分为3.52,最高为5分.

接下来构建一个包含每部电影的平均评分和被评分次数的dataframe,用来计算电影间的相关性.相关性是一种统计度量,用来表示两个或多个变量在一起波动的程度,电影之间的相关系数越高,越相似.

在本例中,我们将使用皮尔逊相关系数,它的变化范围为-1到1.当相关系数为1时,为完全正相关;当相关系数为-1时,为完全负相关;相关系数越接近于0,相关度越弱.利用pandas
中的groupby功能创建dataframe,按标题列对数据集进行分组,并计算每部电影的平均分.

```
ratings = pd.DataFrame(df.groupby('title')['rating'].mean())
ratings.head()
```

接下来计算每部电影被评分的次数,观察它与电影平均评分之间的关系.一部5分的电影很可能只有一个用户评分.从统计学上来说,把它视为5分电影是不合理的.

因此,在构建推荐系统时,我们需要为评分次数设置一个阈值.使用pandas中的 groupby功能创建number_of_ratings列,按title列进行分组,然后使用count函数计算每部电影的被评分次数.之后,使用head()
函数查看新的dataframe.

```
ratings['number_of_ratings'] = df.groupby('title')['rating'].count()
ratings.head()
```

利用pandas中的绘图功能绘制直方图,可视化评分分布.

```
import matplotlib.pyplot as plt
%matplotlib inline
ratings['rating'].hist(bins=50)
```

从中可以看出,多数电影的分值在2.5到4分之间.接下来将以同样的方式对number_of_ratings进行可视化.

```
ratings['number_of_ratings'].hist(bins=60)
```

从直方图中可以清楚地看出大多数电影都只有较少的评分,那些评分次数多的电影都拥有较高的知名度.

接下来探索电影评分和被评分次数之间的关系.使用seaborn绘制散点图,通过jointplot()函数实现.

```
import seaborn as sns
sns.jointplot(x='rating', y='number_of_ratings', data=ratings)
```

从图中可以看出电影的平均评分和被评分次数之间呈正相关关系.图表显示,一部电影的评分越高,平均分也就越高.在为每部电影的评分设置阈值时,这一点尤其重要.

接下来构建基于项目的推荐系统.我们需要将数据集转换为一个矩阵,以电影标题为列,以user_id为索引,以评分为值.之后会得到一个dataframe,其中列是movie标题,行是user_id.每列代表所有用户对所有电影的评分.若评分为NaN（Not
a Number）,则表示用户没有对某一部电影进行评分.矩阵被用来计算电影之间的相关性.使用pandas中的 pivot_table创建电影矩阵.

```
movie_matrix = df.pivot_table(index='user_id', columns='title', values='rating')
movie_matrix.head()
```

接下来,使用pandas中的 sort_values工具,设置升序为false,以便从评分最高的电影中进行选择,然后使用head()函数查看分数前10的电影.

```
ratings.sort_values('number_of_ratings', ascending=False).head(10)
```

假设某用户看过《空军一号》和《超时空接触》,我们想根据观看历史向该用户推荐电影.通过计算这两个电影和数据集中其他电影的之间的相关性,寻找与之最为相似的电影,为用户进行推荐.首先,用movie_matrix中的电影评分创建一个dataframe.

```
AFO_user_rating = movie_matrix['Air Force One (1997)']
contact_user_rating = movie_matrix['Contact (1997)']
```

Dataframe中包含user_id和对应用户给这两个电影的评分.利用如下代码进行查看.

```
AFO_user_rating.head()
contact_user_rating.head()
```

使用pandas中的corwith功能计算两个dataframe对象的行或列的两两相关关系,从而得出每部电影与《空军一号》电影之间的相关性.

```
similar_to_air_force_one=movie_matrix.corrwith(AFO_user_rating)
```

可以看到,《空军一号》与《直到有您》之间的相关性是0.867,表明这两部电影有很强的相似性.

```
similar_to_air_force_one.head()
```

接下来,计算《超时空接触》和其他电影之间的相关性.程序与上面相同.

```
similar_to_contact = movie_matrix.corrwith(contact_user_rating)
```

通过计算,我们发现《超时空接触》和《直到有您》之间的相关性更强,为0.904.

similar_to_contact.head()
由于只有部分用户对部分电影进行了评分,导致矩阵中有许多缺失的值.为了使结果看起来更有吸引力,我们将删除null值并将correlation results转化为dataframe.

```
corr_contact = pd.DataFrame(similar_to_contact, columns=['Correlation'])
corr_contact.dropna(inplace=True)
corr_contact.head()
corr_AFO = pd.DataFrame(similar_to_air_force_one, columns=['correlation'])
corr_AFO.dropna(inplace=True)
corr_AFO.head()
```

通过上述步骤,计算出了与《超时空接触》和《空军一号》最为相似的电影.然而,有些电影被评价的次数很低,最终可能仅仅因为一两个人给了5分而被推荐.设置阈值可解决这个问题.从之前的直方图中我们看到评分次数从100急剧下降,于是我们将阈值设为100,不过您可以根据自己的需求进行调整.接下来,利用number_of_ratings列将两个dataframe连接起来.

```
corr_AFO = corr_AFO.join(ratings['number_of_ratings'])
corr_contact = corr_contact.join(ratings['number_of_ratings'])
corr_AFO .head()
corr_contact.head()
```

获取并查看前10部最为相关的电影.

corr_AFO[corr_AFO['number_of_ratings'] > 100].sort_values(by='correlation', ascending=False).head(10)
由于阈值不同,结果也会有所不同.在设置阈值后,与《空军一号》最相似的电影是《猎杀红色十月》,相关系数为0.554.
接下来获取并查看与《超时空接触》最为相关的前10部电影.

corr_contact[corr_contact['number_of_ratings'] > 100].sort_values(by='Correlation', ascending=False).head(10)
《超时空接触》最相似的电影是《费城》,相关系数为0.446,被评分次数为137.根据此结果,我们可以向喜欢《超时空接触》的用户推荐列表中的电影.

### 改进

本文所构建的推荐系统可以通过基于记忆的协同过滤方法进行改进.我们可以将数据集划分为训练集和测试集,使用诸如余弦相似度之类的方法来计算电影之间的相似度.还可以通过建立基于模型的协同过滤系统,更好地处理可伸缩性和稀疏性问题.同时也可以利用如均方根误差(
RMSE)之类的方法对模型进行评估.除此之外,当所处理的数据量十分庞大时,还可以结合深度学习构建推荐系统.自动编码器和受限的Boltzmann机器也常用于构建高级推荐系统.