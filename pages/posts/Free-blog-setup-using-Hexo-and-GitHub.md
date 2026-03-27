---
title: 基于hexo与github的博客免费搭建
tags:
- hexo
- blog
categories: [技术]
date: 2024-08-13 19:21:21
cover: https://www.cachetide.top/cywl.jpg
---

# 基础准备

## nodejs与git安装

[nodejs下载地址](http://nodejs.cn/)
[git下载地址](https://git-scm.com/)
安装完成后可分别在cmd命令（按住```win+r```后输入```cmd```）中使用一下命令查看版本来确认安装是否完成

```
node -v 
git --version
```

## github账号注册

在github中注册一个账号

# 本地配置

## 服务器配置

由于使用国外的服务器下载，受到的网络影响比较大，不容易安装成功，所以在这里推荐使用淘宝镜像服务器(注：原来的https://registry.npm.taobao.org 已经废弃，无法使用)
打开git，输入以下指令

```
npm config set registry https://registry.npmmirror.com
```

# hexo安装

在电脑中新建一个文件夹（建议命名为blog），并在此文件夹中右键，点击```Open Git Bash here```
输入以下命令来安装hexo

```
npm install hexo-cli -g
```

之后对hexo进行初始化（完成后会在该文件夹下生成文件）、

```
hexo init
```

此时我们可以尝试在启动本地服务器预览博客

```
hexo s
```

(注：hexo s 是hexo sever的缩写)
此时可以在浏览器输入```localhost:4000``` 在本地查看博客，关闭本地博客ctrl+c即可

# 部署到仓库

## 创建仓库

创建一个公共的（选择public）仓库并且将仓库名使用```用户名.github.io``` 的形式（例如我的id是mitaner，则取名 mitaner.github.io）
同时，在该仓库页面里面找到```仓库的SSH地址 ``` （这里不太推荐使用https地址）

## 生成SSHkey

更改yourname和youremail

```
git config --global user.name "你的Github用户名"
```

```
git config --global user.email "你的Github注册邮箱"
```

依旧使用git，首先进入.ssh文件

```
cd ~/.ssh
```

如果显示没有这个文件的话可以使用下面命令创建一个.ssh文件

```
mkdir -p ~/.ssh
```

然后生成key

```
ssh-keygen -t rsa -C"你的Gubith注册邮箱"
```

此处一直回车即可，然后在 ```C:\用户\用户名\.ssh ``` 的目录下，找到文件``` id_rsa.pub ``` 并使用记事本打开，复制其中的所有字符

## key的配置

点击github主页的用户头像并找到设置（```settings ```）点击```SSH and GPG keys```然后点击```New SSH key ``` 最后将上文文件中的字符复制到```key```中
然后再git中进行地址验证

```
ssh -T git@github.com
```

然后输入```yes```

## hexo部署到仓库

在blog的文件加下找到 ``` _config.yml```  文件，打开它（可以直接用即使本打开，或者别的文本编辑器，这里推荐一下***Notepad -*** ）在文本末尾加入一下代码

```
deploy:
  type: 'git'
  repo: 你的仓库SSH地址
  branch: master
```

同时，在```_config.yml ``` 文件中找到url，在后面添加上https://你的Gubith用户名.github.io (注意：在“：”后面需要一个空格，否则会报错)

## 安装git部署命令插件

```
npm install hexo-deployer-git --save
```

## 部署

清除之前生成的东西

```
hexo clean
```

生成静态文章

```
hexo g
```

部署到仓库

```
hexo d
```

*到这里，你就可以打开https://你的Gubith用户名.github.io 来看看自己的博客了，不过，到这里它任然是一个空壳，我们可以来继续完善它。*

# 博客主题安装

这里，你可以自行寻找一个主题（不过还是推荐热门一点的，出问题的方便搜索解决）以下使用butterfly当作示例

## 插件安装

我们首先应该在官方演示文档中查清楚需要什么插件
[butterfly的官方演示文档](https://butterfly.js.org/en/)

```
npm install hexo-renderer-pug hexo-renderer-stylus --save
```

# 主题安装

```
git clone -b master https://gitee.com/immyw/hexo-theme-butterfly.git themes/butterfly
```

在```_config.yml ```文件中找到themes，在后面改成butterfly
之后在blog的根目录下找到themes\butterfly\_config.yml进行主题的配置，详情请参考[butterfly的官方演示文档](https://butterfly.js.org/en/)这里就不进行赘述了

# 文章编写

文章储存在blog根目录下的```source\_post```中，使用```markdown```语言，可以看看这个
[md快速入门文档（几分钟就能学会）](https://markdown.com.cn/)
在博客根目录下打开git，输入

```
hexo n 新的文章的名称
```

便会在```_post```中生成文件，可使用记事本或者编辑器打开（这里推荐***Typora***）编辑文章，tags可使用一下方法添加

```
tags: [示例标签1,示例标签2,示例标签3,示例标签4]
```

当然，如果博客没有tags页面的话，可以进行创建

```
hexo new page tags
```

然后打开source/tags/index.md添加如下内容

```
---
title: tags
date: 2024-08-14 17:56:04
type: "tages"
lsyout: "tags"

---
```

# The End

 *未来会不定期补充一下*
