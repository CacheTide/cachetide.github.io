---
layout: post
title: H3C NX30pro 新版固件（V100R010、V100R009）免拆机刷机
tags: [刷机,路由器,Linxu]
categories: [技术]
date: 2026-01-21 17:47:02
cover: https://www.cachetide.top/header2.jpg
---

> 事情是这样的，有傻子想折腾nixos和pixel还有switch那一大堆，为了方便才这样子折腾刷路由器，但是回家那天看见路由器原厂固件可以更新就手贱了，导致折腾了巨大一圈，这里的特别感谢茶栗老师的 [教程](https://chariri.moe/archives/2383/h3c-nx30-pro-openwrt-new-stock-firmware-no-ttl/)

> [!WARNING]
>
> 刷机有概率变砖，请谨慎刷机

此方案是通过备份原厂固件，对固件逆向后添加代码打开telnet口再打开SSH刷入文件

## 基础准备

需要的基础工具有[WinSCP](https://winscp.net/eng/index.php)和[PuTTY](https://winscp.net/eng/index.php)*（似乎不少人喜欢使用[Termius](https://termius.com/),不过我觉得需要注册比较没法，所以使用这种更轻量化开源软件）*

然后我们需要一个linux环境，我自己使用的是wsl，如果要安装wsl可以看我这篇[教程](https://yiurblog.top/posts/%E4%BD%BF%E7%94%A8wsl2%E8%A3%85%E8%BD%BDdebian)。这是因为原厂固件本质上是linux系统，不同文件有不同的权限，win目录下解压会导致这些权限全部变成普通用户，没法打开telnet口~~我已经踩过坑了~~

其次需要一个python环境，用来对文件进行解密，当然异或的话能用什么语言写出来都可以，这里提供了安装环境的[教程](https://www.runoob.com/python3/python3-install.html)~~（不过我自己用的minicoda）~~

最后是准备刷写的固件，可以根据需求选择，不过记得匹配一下uboot版本，要不然会变砖，这里扔一个固件，[来源](https://www.right.com.cn/forum/thread-8291820-1-1.html)
链接：https://pan.quark.cn/s/0e169171cd7b?pwd=NF7h

## 逆向原厂固件打开telnet

首先进入192.168.124.1的原厂后台，再选择 更多- 设备管理- 设备管理 - 配置备份，获得`NX30Pro.cfg` 文件

这个文件是异或加密的这里抄茶栗老师的异或脚本

```python
#!/usr/bin/python3
import sys
import os
 
def xor_file(input_path):
    # 1. Validation: Ensure the file exists
    if not os.path.isfile(input_path):
        print(f"Error: File '{input_path}' not found.")
        return
 
    # 2. Define the output filename
    base_name = os.path.basename(input_path)
    output_path = f"decoded-{base_name}"
 
    try:
        # 3. Read the input file in binary mode ('rb')
        with open(input_path, 'rb') as f:
            data = f.read()
 
        # 4. Perform XOR 0x55 on each byte
        # We use a bytearray for efficient processing
        processed_data = bytearray(b ^ 0x55 for b in data)
 
        # 5. Write the result to the new file in binary mode ('wb')
        with open(output_path, 'wb') as f:
            f.write(processed_data)
 
        print(f"Success! Processed file saved as: {output_path}")
 
    except Exception as e:
        print(f"An error occurred: {e}")
 
if __name__ == "__main__":
    # Check if a filename was provided as a command-line argument
    if len(sys.argv) < 2:
        print("Usage: python script_name.py <filename>")
    else:
        xor_file(sys.argv[1])

```

新手可以直接拿记事本粘贴上去，然后把文件名改成`.py`后缀就好了，我这里文件命名为`xor.py`

然后把`NX30Pro.cfg`和`xor.py`放在同一个文件夹，在这个文件夹打开cmd或者终端（在文件资源管理器的地址栏直接输入cmd或者powershell）

输入

```
python xor.py NX30Pro.cfg
```

也可能是

```
python3 xor.py NX30Pro.cfg
```

这时候得到`decoded-NX30Pro.cfg`

把`decoded-NX30Pro.cfg`拷贝到linux里面vm,wsl(请不要使用wsl直接操作win目录，一定要拷贝到linux目录下)都可以

打开拷贝后`decoded-NX30Pro.cfg`所在的目录

先

```
su
```

输入密码后进入root（输密码看不见是正常情况，只是隐藏了而已）

再改一个后缀方便系统识别压缩包

```
mv decoded-NX30Pro.cfg decoded-NX30Pro.tar.gz
```

创建两个文件夹用来放解压后文件

```
mkdir NX30Pro-config
mkdir NX30Pro
```

保留权限解压文件

```
tar -xpzf decoded-NX30Pro.tar.gz -C NX30Pro-config
```

现在output里面有`NX30Pro.info` `NX30Pro.tar.gz`两个文件了

解压另一个压缩文件到NX30Pro文件夹

```
cd NX30Pro-config
tar -xpzf decoded-NX30Pro.tar.gz -C ../NX30Pro
```

随后进入config目录

```
cd ../NX30Pro/mnt/config
```

建立NX30Pro/mnt/config/script目录并添加文件

```
mkdir script
cd script
nano enable-telnet.sh
```

随后进入编辑器添加以下代码

```
#!/bin/sh
telnetd -l /bin/sh -p 7788
```

然后按住`Ctrl+X`再按`y`最后按`Enter`保存并退出

再编辑firewall

```
cd ..
nano firewall
```

在文件开头添加

```
config include 'custom'
        option type 'script'
        option path '/etc/config/script/enable-telnet.sh'
        option family 'any'
        option enable '1'
        option reload '1'
```

依旧按住`Ctrl+X`再按`y`最后按`Enter`保存并退出

接下来要更改检验文件

```
rm -rf cfgmd5/firewall*
fwmd5=$(md5sum firewall | awk '{print $1}')
touch "cfgmd5/firewall-$fwmd5"
```

这样`firewall`的检验文件就改好了

接下来先保留全权限压缩文件回去

```
cd ../..
tar -czpf ../NX30Pro-config/NX30Pro.tar.gz *
```

修改info的md5检验文件

```
cd ../NX30Pro-config
cfmd5=$(md5sum NX30Pro.tar.gz | awk '{print $1}')
echo -e "NX30ProV100R010\n$cfmd5" > NX30Pro.info
```

再进行保留权限压缩

```
tar -czpf ../NX30Pro-finished.cfg *
```

接下来来可以把`NX30Pro-finished.cfg`复制回原来的文件夹

在当前目录的终端使用

```
python xor.py NX30Pro-finished.cfg
```

异或给文件加密回去，最后上传`decoded-NX30Pro-finished.cfg`文件到路由器，就会发现telnet口打开了

~~（一个手贱让我耗费八百年）~~

## 开启SSH

这一步请确保路由器能正常联网。打开PuTTY，在Host Name输入`192.168.124.1`，Port为`7788`，要记得Connection type选择`Other:Telnet`

连接上后执行以下命令(这个终端的复制是`ctrl+shift+v`)打开ssh

```
curl -o /tmp/dropbear.ipk https://downloads.openwrt.org/releases/packages-19.07/aarch64_cortex-a53/base/dropbear_2019.78-2_aarch64_cortex-a53.ipk
opkg install /tmp/dropbear.ipk
/etc/init.d/dropbear enable
/etc/init.d/dropbear start
```

## 备份原厂固件

然后先备份一个路由器原厂文件

```
dd if=/dev/mtd5 of=/tmp/backup.img
```

然后打开 WinSCP，文件协议选择 `SCP`，主机名 `192.168.124.1`，端口号 `22`，用户名 `root`，密码`admin`

登录后，将右侧 NX30Pro tmp 路径下的 backup.img 文件拖到左边电脑上保存，这是官方固件的备份

## 写入新固件

将下载好的 uboot.bin 文件从左边电脑拖进右侧路由器 tmp 路径下

先进行MD5校验

在PuTTY打开的终端输入

```
cd /tmp
md5sum uboot.bin
```

如果使用上述固件必须为`5c12bd472c255a1e28819e95a3151bf1`，要不然文件损坏会变砖

然后执行命令写入 uboot

```
mtd write /tmp/uboot.bin FIP
```

接下来先断开路由器网线和电源线，先按住背后 Reset 恢复按钮不放，再插电，等待 10s 左右松开背后 Reset，电脑用网线连接路由器 LAN1，同时在电脑设置-网络和Internet-以太网-IP分配（编辑）设置为手动，打开ipv4,IP地址填 192.168.1.2，子网掩码 255.255.255.0，网关 192.168.1.1，DNS 192.168.1.1

然后在浏览器打开  192.168.1.1 就能打开 uboot 后台

选择下载好的 NX30pro 的固件，upload 上传后，update 更新，写入即可，完成后会显示成功不过依旧会转圈（~~有傻子没看字，一直转圈以为变砖了）~~

## openwrt

路由器自动重启后就进入了openwrt，台地址 192.168.6.1，用户名 root，密码 password

记得把电脑以太网设置改回去

然后在后台-无线里面，点击类似于 **接口**： ra0 | **类型:** AP | **SSID:** MTK_CHEETAH_AP_2.4G | **信道:** 7 **BSSID:** 00:78:32:26:60:e0 | **无线模式:** HE_2G这一栏的配置修改2.4G与5Gwifi的密码，认证模式选择`WPAPSKWPA2PSK`（够一般家庭使用了）再输入密码

接下来自己美美折腾去（x
