---
title: "从零配置 NixOS + niri + Noctalia Shell：我的 Wayland 桌面实践"
date: 2026-05-14
cover: https://www.cachetide.top/header4.jpg
categories: [技术]
tags:
  - NixOS
  - niri
  - Wayland
  - Noctalia
  - fcitx5
  - systemd-boot
---

> 这篇文章记录配置 NixOS + niri + Noctalia Shell 的完整过程。
>

本文配置已经在自己机器上验证过：

- NixOS unstable
- niri Wayland compositor
- SDDM + niri session
- Noctalia Shell 接管 Shell 和通知
- fcitx5 + 中文拼音
- hyprlock + swayidle
- grim/slurp/satty 截图
- systemd-boot 双系统菜单，NixOS 和 Windows 可选
- Docker、VSCode、Rust、Python、Go、JetBrains Toolbox 等开发工具

> 注意：下面的用户名、磁盘分区、显卡 Bus ID、Windows EFI 分区 PARTUUID、代理地址都需要按自己的机器替换，不要无脑照抄。

需要替换的关键变量：

| 项目 | 本文示例 | 你需要改成 |
| --- | --- | --- |
| 用户名 | `cachetide` | 你的普通用户 |
| 主机名 | `nixos` | 你的主机名 |
| flake 路径 | `/home/cachetide/nixos-noctalia` | 你的配置仓库路径 |
| 代理地址 | `http://127.0.0.1:7897` | 你的代理地址，或删除代理配置 |
| NVIDIA Bus ID | `PCI:1:0:0` | `lspci` 查到的 NVIDIA Bus ID |
| AMD Bus ID | `PCI:7:0:0` | `lspci` 查到的 AMD/Intel 核显 Bus ID |
| Windows ESP PARTUUID | `52237cc3-791a-4589-b4c6-a806a91a1f93` | `lsblk` 查到的 Windows EFI 分区 PARTUUID |

## 1. 基础环境

我的环境大致如下：

- 用户名：`cachetide`
- 主机名：`nixos`
- EFI 分区挂载点：`/boot`
- NixOS 配置目录：`/etc/nixos`
- flake 工作目录：`/home/cachetide/nixos-noctalia`
- niri 用户配置：`~/.config/niri/config.kdl`
- Windows 在另一块硬盘上，有自己的 EFI 分区
- 代理地址：`http://127.0.0.1:7897`

如果你不是这个用户名，文中所有 `cachetide` 都要替换成你自己的用户名。

## 2. 安装 NixOS 时的配置

先用官方 NixOS ISO 启动，分区、挂载、生成配置。建议先看清楚：

```bash
lsblk -o NAME,PATH,SIZE,FSTYPE,LABEL,PARTLABEL,PARTUUID,MOUNTPOINTS
```

安装时至少保证：

- EFI 分区挂载到 `/mnt/boot`
- 根分区挂载到 `/mnt`
- 如果有 `/home`、`/nix`、swap，根据自己的分区方案挂载

生成配置：

```bash
sudo nixos-generate-config --root /mnt
```

安装前，`/mnt/etc/nixos/configuration.nix` 里至少需要这些基础项：

```nix
{ config, lib, pkgs, ... }:

{
  imports = [
    ./hardware-configuration.nix
  ];

  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;
  boot.loader.systemd-boot.configurationLimit = 10;

  networking.hostName = "nixos";
  networking.networkmanager.enable = true;

  time.timeZone = "Asia/Shanghai";
  i18n.defaultLocale = "zh_CN.UTF-8";

  users.users.cachetide = {
    isNormalUser = true;
    extraGroups = [ "wheel" "networkmanager" "video" "audio" ];
  };

  nix.settings.experimental-features = [ "nix-command" "flakes" ];
  nixpkgs.config.allowUnfree = true;

  programs.niri.enable = true;

  services.displayManager = {
    enable = true;
    sddm.enable = true;
    sddm.wayland.enable = true;
    defaultSession = "niri";
    autoLogin = {
      enable = true;
      user = "cachetide";
    };
  };

  system.stateVersion = "25.11";
}
```

`system.stateVersion` 不要按本文硬改。它应该保留为你第一次安装 NixOS 时生成的版本值，后续系统升级也不要手贱改它。

然后安装：

```bash
sudo nixos-install
```

安装完成后重启进入系统。

## 3. 用 flake 包装系统配置

我没有直接把所有东西都塞进 `/etc/nixos/configuration.nix`，而是把系统原配置作为一个 flake 输入，然后在用户目录里维护额外模块。目录结构：

```text
/home/cachetide/nixos-noctalia
├── flake.nix
├── niri-manual.nix
└── noctalia.nix
```

`flake.nix`：

```nix
{
  description = "NixOS wrapper with niri and Noctalia Shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    system-config = {
      url = "path:/etc/nixos";
      flake = false;
    };

    noctalia = {
      url = "github:noctalia-dev/noctalia-shell";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { nixpkgs, system-config, noctalia, ... }@inputs: {
    nixosConfigurations.nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      specialArgs = { inherit inputs; };
      modules = [
        "${system-config}/configuration.nix"
        ./niri-manual.nix
        ./noctalia.nix
      ];
    };
  };
}
```

这样做的好处是：

- `/etc/nixos/configuration.nix` 保留基础系统和硬件扫描结果
- niri、Noctalia、输入法、代理、软件包可以分文件维护
- 后续迁移配置时更清楚

## 4. niri 系统模块

新建 `niri-manual.nix`，主要负责 niri 桌面、音频、输入法、字体、蓝牙、截图工具、锁屏和 portal。

```nix
{ config, lib, pkgs, ... }:

{
  programs.niri.enable = lib.mkDefault true;

  services.displayManager = {
    enable = lib.mkDefault true;
    defaultSession = lib.mkDefault "niri";
    autoLogin = {
      enable = lib.mkDefault true;
      user = lib.mkDefault "cachetide";
    };
    sddm = {
      enable = lib.mkDefault true;
      wayland.enable = lib.mkDefault true;
    };
  };

  security.polkit.enable = lib.mkDefault true;
  services.gnome.gnome-keyring.enable = lib.mkDefault true;
  programs.dconf.enable = lib.mkDefault true;

  security.rtkit.enable = lib.mkDefault true;
  services.pipewire = {
    enable = lib.mkDefault true;
    alsa.enable = lib.mkDefault true;
    alsa.support32Bit = lib.mkDefault true;
    pulse.enable = lib.mkDefault true;
    wireplumber.enable = lib.mkDefault true;
  };

  fonts.packages = with pkgs; [
    noto-fonts
    noto-fonts-cjk-sans
    noto-fonts-color-emoji
    nerd-fonts.jetbrains-mono
  ];

  environment.systemPackages = with pkgs; [
    niri
    niriswitcher
    xwayland-satellite
    vicinae
    quickshell
    alacritty
    kdePackages.dolphin
    google-chrome
    swaybg
    swayidle
    hyprlock
    brightnessctl
    wireplumber
    grim
    slurp
    satty
    flameshot
    wl-clipboard
    libnotify
    blueman
    pavucontrol
    kdePackages.breeze
    wshowkeys
    qt6Packages.fcitx5-configtool
    qt6Packages.qt6ct
  ];
}
```

### 蓝牙和 XDG Portal

蓝牙直接交给 BlueZ。`blueman` 可以先装着用于排查，但我的最终配置没有启用 `services.blueman`，避免和 Shell 的控制中心重复。

```nix
{
  hardware.bluetooth = {
    enable = lib.mkDefault true;
    powerOnBoot = lib.mkDefault true;
    settings = {
      General = {
        ControllerMode = "dual";
      };
      Policy = {
        AutoEnable = true;
      };
    };
  };

  services.blueman.enable = lib.mkForce false;

  systemd.services.bluetooth.serviceConfig.CapabilityBoundingSet = lib.mkForce [
    "CAP_NET_ADMIN"
    "CAP_NET_BIND_SERVICE"
  ];

  systemd.services.bluetooth-power-on = {
    description = "Ensure Bluetooth controller is powered on";
    after = [ "bluetooth.service" ];
    requires = [ "bluetooth.service" ];
    wantedBy = [ "multi-user.target" ];
    serviceConfig = {
      Type = "oneshot";
      ExecStart = "${pkgs.bluez}/bin/bluetoothctl power on";
    };
  };
}
```

Wayland 下截图、文件选择器、屏幕共享等功能依赖 portal。niri 自己会提供一部分 portal，系统侧再补 GTK/GNOME portal：

```nix
{
  xdg.portal = {
    enable = lib.mkDefault true;
    extraPortals = with pkgs; [
      xdg-desktop-portal-gtk
      xdg-desktop-portal-gnome
    ];
    config.niri = {
      "org.freedesktop.impl.portal.FileChooser" = [ "gtk" ];
    };
  };
}
```

### NVIDIA PRIME 配置

我的机器是 AMD 核显 + NVIDIA 独显，需要 PRIME offload：

```nix
{
  hardware.graphics.enable = lib.mkDefault true;
  services.xserver.videoDrivers = lib.mkForce [ "nvidia" ];

  hardware.nvidia = {
    modesetting.enable = lib.mkDefault true;
    open = lib.mkDefault true;
    nvidiaSettings = lib.mkDefault true;
    package = lib.mkDefault config.boot.kernelPackages.nvidiaPackages.stable;
    powerManagement.enable = lib.mkDefault true;
    prime = {
      offload.enable = lib.mkForce true;
      offload.enableOffloadCmd = lib.mkForce true;
      nvidiaBusId = "PCI:1:0:0";
      amdgpuBusId = "PCI:7:0:0";
    };
  };
}
```

这里的 `nvidiaBusId` 和 `amdgpuBusId` 必须按自己的机器改。可以用：

```bash
lspci | grep -Ei 'vga|3d|display|nvidia|amd|intel'
```

如果系统没有 `lspci`，把 `pciutils` 加到 `environment.systemPackages`。

### fcitx5 中文输入法

```nix
{
  i18n.inputMethod = {
    enable = lib.mkDefault true;
    type = lib.mkDefault "fcitx5";
    fcitx5 = {
      waylandFrontend = lib.mkDefault true;
      addons = with pkgs; [
        qt6Packages.fcitx5-chinese-addons
        fcitx5-gtk
        kdePackages.fcitx5-qt
      ];
    };
  };

  environment.sessionVariables = {
    NIXOS_OZONE_WL = lib.mkDefault "1";
    QT_QPA_PLATFORMTHEME = lib.mkDefault "qt6ct";
    QT_IM_MODULE = lib.mkDefault "fcitx";
    XMODIFIERS = lib.mkDefault "@im=fcitx";
    QT_IM_MODULES = lib.mkDefault "wayland;fcitx";
    GTK_IM_MODULE = lib.mkDefault "fcitx";
    SDL_IM_MODULE = lib.mkDefault "";
    GLFW_IM_MODULE = lib.mkDefault "";
  };

  systemd.user.services.fcitx5 = {
    description = "Fcitx 5 input method";
    after = [ "graphical-session.target" "dbus.service" ];
    partOf = [ "graphical-session.target" ];
    wantedBy = [ "graphical-session.target" "niri.service" ];
    environment = {
      GTK_IM_MODULE = "fcitx";
      QT_IM_MODULE = "fcitx";
      QT_IM_MODULES = "wayland;fcitx";
      XMODIFIERS = "@im=fcitx";
      SDL_IM_MODULE = "";
      GLFW_IM_MODULE = "";
    };
    serviceConfig = {
      Type = "simple";
      ExecStartPre = "${pkgs.systemd}/bin/systemctl --user set-environment GTK_IM_MODULE=fcitx QT_IM_MODULE=fcitx QT_IM_MODULES=wayland;fcitx XMODIFIERS=@im=fcitx SDL_IM_MODULE= GLFW_IM_MODULE=";
      ExecStart = "${lib.hiPrio config.i18n.inputMethod.package}/bin/fcitx5 -r --verbose=info";
      Restart = "on-failure";
      RestartSec = 2;
    };
  };
}
```

我用 systemd user service 启动 fcitx5，所以把桌面环境自动生成的 XDG autostart 入口隐藏掉，避免同一个 fcitx5 被拉起两次：

```nix
{
  environment.etc."xdg/autostart/org.fcitx.Fcitx5.desktop".text = ''
    [Desktop Entry]
    Type=Application
    Name=Fcitx 5
    Hidden=true
  '';
}
```

默认中文输入法可以写 `~/.config/fcitx5/profile`：

```ini
[Groups/0]
Name=Default
Default Layout=us
DefaultIM=pinyin

[Groups/0/Items/0]
Name=keyboard-us
Layout=

[Groups/0/Items/1]
Name=pinyin
Layout=

[GroupOrder]
0=Default
```

常用命令：

```bash
fcitx5-remote -o   # 切到中文
fcitx5-remote -c   # 切回英文
systemctl --user restart fcitx5.service
```

### 锁屏和空闲

 `hyprlock` 锁屏，`swayidle` 负责空闲触发。注意不要在锁屏后一秒关显示器，否则解锁后容易黑屏一会。

```nix
{
  systemd.user.services.swayidle = {
    description = "Idle management for niri";
    after = [ "graphical-session.target" ];
    partOf = [ "graphical-session.target" ];
    unitConfig.Requisite = "graphical-session.target";
    wantedBy = [ "niri.service" ];
    serviceConfig = {
      ExecStart = "${pkgs.swayidle}/bin/swayidle -w timeout 600 \"${pkgs.hyprlock}/bin/hyprlock\" before-sleep \"${pkgs.hyprlock}/bin/hyprlock\"";
      Restart = "on-failure";
    };
  };
}
```

## 5. Noctalia Shell 模块

`noctalia.nix` 负责 Noctalia Shell、代理、常用软件、Docker、1Password、双系统菜单等。

```nix
{ inputs, pkgs, lib, ... }:

let
  system = pkgs.stdenv.hostPlatform.system;
  proxyUrl = "http://127.0.0.1:7897";
  noProxy = "127.0.0.1,localhost,::1";
  proxyEnv = {
    http_proxy = proxyUrl;
    https_proxy = proxyUrl;
    all_proxy = proxyUrl;
    no_proxy = noProxy;
    HTTP_PROXY = proxyUrl;
    HTTPS_PROXY = proxyUrl;
    ALL_PROXY = proxyUrl;
    NO_PROXY = noProxy;
  };
in
{
  nix.settings = {
    substituters = [
      "https://mirrors.ustc.edu.cn/nix-channels/store?priority=10"
      "https://mirrors.tuna.tsinghua.edu.cn/nix-channels/store?priority=20"
      "https://hyprland.cachix.org?priority=30"
      "https://cache.nixos.org?priority=40"
    ];
    trusted-public-keys = [
      "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
      "hyprland.cachix.org-1:AwCk1JI9COPn1KiK4mwGV+nxduw0PjoY2TyIqf3mCko="
    ];
    connect-timeout = 10;
    download-attempts = 8;
    fallback = true;
  };

  networking.proxy = {
    default = proxyUrl;
    noProxy = noProxy;
  };

  environment.sessionVariables = proxyEnv;
  systemd.services.nix-daemon.environment = proxyEnv;
}
```

如果你没有本地代理，就删掉 `networking.proxy` 和 `systemd.services.nix-daemon.environment` 相关内容。

### 安装软件和开发工具

```nix
{
  environment.systemPackages = [
    inputs.noctalia.packages.${system}.default
    pkgs.fastfetch
    pkgs.hyfetch
    pkgs.zsh
    pkgs.vscode
    pkgs.telegram-desktop
    pkgs.gcc
    pkgs.clang
    pkgs.gnumake
    pkgs.cmake
    pkgs.pkg-config
    pkgs.gdb
    pkgs.rustup
    pkgs.python3
    pkgs.python3Packages.pip
    pkgs.go
    pkgs.uv
    pkgs.jetbrains-toolbox
    pkgs.vlc
    pkgs.todesk
    pkgs._1password-cli
    pkgs._1password-gui
  ];

  programs.zsh.enable = true;

  programs._1password.enable = true;
  programs._1password-gui = {
    enable = true;
    polkitPolicyOwners = [ "cachetide" ];
  };

  virtualisation.docker.enable = true;

  users.users.cachetide = {
    shell = pkgs.zsh;
    extraGroups = [ "docker" ];
  };
}
```

Docker 加入用户组后需要重新登录，或者临时执行：

```bash
newgrp docker
```

Rust 第一次使用：

```bash
rustup default stable
rustup component add rust-analyzer clippy rustfmt
```

### Noctalia Shell 自启动

```nix
{
  systemd.user.services.noctalia-shell = {
    description = "Noctalia Shell";
    after = [ "graphical-session.target" ];
    partOf = [ "graphical-session.target" ];
    wantedBy = [ "graphical-session.target" "niri.service" ];
    serviceConfig = {
      Type = "simple";
      ExecStart = "${inputs.noctalia.packages.${system}.default}/bin/noctalia-shell";
      Restart = "on-failure";
      RestartSec = 2;
    };
  };

  services.power-profiles-daemon.enable = lib.mkDefault true;
  services.upower.enable = lib.mkDefault true;
}
```

## 6. niri 用户配置

niri 的用户配置路径：

```text
~/.config/niri/config.kdl
```

每次改完先验证：

```bash
niri validate
```

### 输入和常用快捷键

```kdl
input {
    keyboard {
        xkb {
            layout "us"
        }
        numlock
    }

    touchpad {
        tap
        natural-scroll
        scroll-method "two-finger"
    }

    disable-power-key-handling
    mod-key "Super"
    mod-key-nested "Alt"
}

binds {
    Mod+L hotkey-overlay-title="Lock the Screen: hyprlock" { spawn "hyprlock"; }
    Mod+Return hotkey-overlay-title="Open a Terminal" { spawn "alacritty"; }
    Mod+A hotkey-overlay-title="Run an Application" { spawn "vicinae" "toggle"; }
    Mod+D hotkey-overlay-title="Open the File Manager" { spawn "dolphin"; }
    Mod+X hotkey-overlay-title="Open a browser: chrome" {
        spawn "google-chrome-stable" "--ozone-platform=wayland" "--enable-wayland-ime" "--wayland-text-input-version=3";
    }

    Mod+Tab repeat=false { toggle-overview; }
    Mod+Q repeat=false { close-window; }

    Mod+Left  { focus-column-left; }
    Mod+Right { focus-column-right; }
    Mod+Up    { focus-window-up; }
    Mod+Down  { focus-window-down; }

    Mod+Shift+Left  { move-column-left; }
    Mod+Shift+Right { move-column-right; }
    Mod+Shift+Up    { move-window-up; }
    Mod+Shift+Down  { move-window-down; }

    Mod+1 { focus-workspace 1; }
    Mod+2 { focus-workspace 2; }
    Mod+3 { focus-workspace 3; }
    Mod+4 { focus-workspace 4; }

    Mod+Shift+1 { move-column-to-workspace 1; }
    Mod+Shift+2 { move-column-to-workspace 2; }
    Mod+Shift+3 { move-column-to-workspace 3; }
    Mod+Shift+4 { move-column-to-workspace 4; }

    Mod+W { toggle-windowed-fullscreen; }
    Mod+F { expand-column-to-available-width; }
    Mod+Shift+F { fullscreen-window; }

    Mod+Shift+P { power-off-monitors; }
}
```

### 布局和外观

```kdl
layout {
    gaps 10
    background-color "transparent"
    center-focused-column "never"
    always-center-single-column

    preset-column-widths {
        proportion 0.5
        proportion 0.2444
        proportion 0.7556
    }

    focus-ring {
        off
    }

    border {
        off
    }
}

window-rule {
    geometry-corner-radius 20
    clip-to-geometry true

    border {
        on
        width 4
        active-gradient from="#bd93f9" to="#94b9fa" angle=135
        inactive-color "#505050"
        urgent-color "#9b0000"
    }

    focus-ring {
        off
    }
}
```

### 环境变量和自启动

```kdl
environment {
    QT_QPA_PLATFORMTHEME "qt6ct"
    LANG "zh_CN.UTF-8"
    LC_CTYPE "zh_CN.UTF-8"
    QT_IM_MODULE "fcitx"
    XMODIFIERS "@im=fcitx"
    QT_IM_MODULES "wayland;fcitx"
    GTK_IM_MODULE "fcitx"
    SDL_IM_MODULE null
    GLFW_IM_MODULE null
}

spawn-at-startup "niri-switch-daemon"
spawn-at-startup "vicinae" "server"
spawn-at-startup "hyprlock"
spawn-sh-at-startup "swaybg -i ~/Pictures/wallpaper.png -m fill"

hotkey-overlay {
    skip-at-startup
}

prefer-no-csd

cursor {
    xcursor-theme "breeze"
    xcursor-size 24
    hide-when-typing
}
```

`spawn-at-startup "hyprlock"` 会在 niri 启动后立刻进入锁屏。如果你不想开机进桌面后自动锁屏，删掉这一行即可，`swayidle` 仍然会在空闲时锁屏。

### overview 黑背景修复

如果 `swaybg` 作为壁纸层，但 overview 里窗口外是黑的，可以加：

```kdl
layer-rule {
    match namespace="^wallpaper$"
    place-within-backdrop true
}
```

这条规则很关键，它让壁纸层进入 niri 的 backdrop。

## 7. Noctalia 壁纸接管问题

Noctalia Shell 很强，但它自己的壁纸功能可能和 niri 的 `swaybg` 冲突，表现为：

- overview 周围背景发黑
- 缩略图周围出现灰色
- 壁纸层被 Noctalia 覆盖

我的做法是让 Noctalia 负责 Shell 和通知，但不接管壁纸。修改：

```text
~/.config/noctalia/settings.json
```

关键值：

```json
{
  "wallpaper": {
    "enabled": false
  },
  "noctaliaPerformance": {
    "disableWallpaper": true
  },
  "idle": {
    "enabled": false
  },
  "notifications": {
    "enabled": true
  }
}
```

如果你用 Noctalia 自己的锁屏/idle，也要注意不要和 `swayidle + hyprlock` 重复。

## 8. 稳定截图方案

niri 内置截图和 Flameshot 在某些 Wayland 环境下不稳定。我最后用 `grim + slurp + satty + wl-copy` 写了一个脚本。

路径：

```text
~/.local/bin/niri-screenshot
```

内容：

```bash
#!/usr/bin/env bash
set -u

out_dir="${XDG_PICTURES_DIR:-$HOME/Pictures}/ScreenShot"
mode="${1:-area-edit}"

mkdir -p "$out_dir"

timestamp() {
  date '+%Y-%m-%d %H-%M-%S'
}

select_region() {
  slurp
}

case "$mode" in
  full)
    grim "$out_dir/$(timestamp).png"
    ;;
  full-clip)
    grim - | wl-copy --type image/png
    ;;
  full-edit)
    grim - | satty \
      --filename - \
      --output-filename "$out_dir/%Y-%m-%d %H-%M-%S.png" \
      --copy-command wl-copy
    ;;
  area)
    geometry="$(select_region)" || exit 0
    grim -g "$geometry" "$out_dir/$(timestamp).png"
    ;;
  area-clip)
    geometry="$(select_region)" || exit 0
    grim -g "$geometry" - | wl-copy --type image/png
    ;;
  area-edit)
    geometry="$(select_region)" || exit 0
    grim -g "$geometry" - | satty \
      --filename - \
      --output-filename "$out_dir/%Y-%m-%d %H-%M-%S.png" \
      --copy-command wl-copy
    ;;
  *)
    echo "Usage: niri-screenshot {full|full-clip|full-edit|area|area-clip|area-edit}" >&2
    exit 2
    ;;
esac
```

加执行权限：

```bash
chmod +x ~/.local/bin/niri-screenshot
```

niri 快捷键：

```kdl
Alt+J { spawn "/home/cachetide/.local/bin/niri-screenshot" "area-edit"; }
Alt+Shift+J { spawn "/home/cachetide/.local/bin/niri-screenshot" "full-edit"; }

Print { spawn "/home/cachetide/.local/bin/niri-screenshot" "full"; }
Ctrl+Print { spawn "/home/cachetide/.local/bin/niri-screenshot" "full-clip"; }
Alt+Print { spawn "/home/cachetide/.local/bin/niri-screenshot" "area"; }
```

验证：

```bash
~/.local/bin/niri-screenshot full
ls -lt ~/Pictures/ScreenShot | head
```

## 9. 双系统启动菜单

我的 Windows 在另一块硬盘上，Windows 自己有 EFI 分区。UEFI 里有 Windows Boot Manager，但 systemd-boot 菜单默认只扫描 NixOS 自己的 ESP，所以菜单里看不到 Windows。

我的最终方案是：把 Windows 的 EFI/Microsoft 目录同步到 NixOS 的 ESP，然后 systemd-boot 直接启动：

```text
/EFI/Microsoft/Boot/bootmgfw.efi
```

先查 Windows ESP 的 PARTUUID：

```bash
lsblk -o NAME,PATH,SIZE,FSTYPE,LABEL,PARTLABEL,PARTUUID,MOUNTPOINTS
```

我的 Windows ESP 是：

```text
PARTUUID=52237cc3-791a-4589-b4c6-a806a91a1f93
```

配置：

```nix
{
  boot.loader.timeout = null;

  boot.loader.systemd-boot.extraEntries = {
    "windows_11.conf" = ''
      title Windows Boot Manager
      efi /EFI/Microsoft/Boot/bootmgfw.efi
      sort-key o_windows
    '';
  };

  boot.loader.systemd-boot.extraInstallCommands = ''
    win_esp=/mnt/win-efi
    mounted=0

    ${pkgs.coreutils}/bin/mkdir -p "$win_esp" /boot/EFI/Microsoft
    if ! ${pkgs.util-linux}/bin/findmnt -rn "$win_esp" >/dev/null; then
      ${pkgs.util-linux}/bin/mount -o ro /dev/disk/by-partuuid/52237cc3-791a-4589-b4c6-a806a91a1f93 "$win_esp"
      mounted=1
    fi

    ${pkgs.coreutils}/bin/cp -r "$win_esp/EFI/Microsoft/." /boot/EFI/Microsoft/

    if [ "$mounted" = 1 ]; then
      ${pkgs.util-linux}/bin/umount "$win_esp"
    fi
  '';
}
```

`boot.loader.timeout = null` 会生成：

```text
timeout menu-force
```

也就是启动菜单无限等待，不会倒计时自动进入默认项。

写入启动菜单：

```bash
sudo nixos-rebuild boot --flake /home/cachetide/nixos-noctalia#nixos
```

验证：

```bash
sudo bootctl list --no-pager
sudo cat /boot/loader/entries/windows_11.conf
```

应该能看到：

```text
title Windows Boot Manager
efi /EFI/Microsoft/Boot/bootmgfw.efi
sort-key o_windows
```

## 10. rebuild 命令

普通切换：

```bash
sudo systemd-run --pty --wait --collect \
  -E PATH=/run/current-system/sw/bin:/nix/var/nix/profiles/default/bin:/usr/bin:/bin \
  -E http_proxy=http://127.0.0.1:7897 \
  -E https_proxy=http://127.0.0.1:7897 \
  -E all_proxy=http://127.0.0.1:7897 \
  nixos-rebuild switch --flake /home/cachetide/nixos-noctalia#nixos
```

涉及 bootloader、显卡驱动、内核时：

```bash
sudo systemd-run --pty --wait --collect \
  -E PATH=/run/current-system/sw/bin:/nix/var/nix/profiles/default/bin:/usr/bin:/bin \
  -E http_proxy=http://127.0.0.1:7897 \
  -E https_proxy=http://127.0.0.1:7897 \
  -E all_proxy=http://127.0.0.1:7897 \
  nixos-rebuild boot --flake /home/cachetide/nixos-noctalia#nixos
```

为什么用 `systemd-run`？

我遇到过 `nixos-rebuild` 在某些环境下报：

```text
[Errno 2] No such file or directory: 'test'
```

显式传入 `PATH` 可以绕开这个问题。代理变量则是为了让 root 侧的 rebuild 和 nix-daemon 都能走代理。

如果修改了 `/etc/nixos/configuration.nix`，而 flake 输入用了：

```nix
system-config.url = "path:/etc/nixos";
```

可能需要刷新锁文件：

```bash
cd /home/cachetide/nixos-noctalia
nix flake lock --update-input system-config
```

## 11. 常用验证命令

系统求值：

```bash
nix eval /home/cachetide/nixos-noctalia#nixosConfigurations.nixos.config.system.build.toplevel.drvPath --raw
```

niri 配置：

```bash
niri validate
niri msg action load-config-file
```

服务状态：

```bash
systemctl --user status noctalia-shell.service
systemctl --user status fcitx5.service
systemctl --user status swayidle.service
systemctl status docker.service
systemctl status bluetooth.service
```

日志：

```bash
journalctl --user -u noctalia-shell.service -b
journalctl --user -u fcitx5.service -b
journalctl -u bluetooth.service -b
```

启动菜单：

```bash
bootctl status
sudo bootctl list --no-pager
```

## 12. 踩坑记录

### 1. 输入法无法切换

重点检查：

- `i18n.inputMethod.type = "fcitx5";`
- `fcitx5-chinese-addons` 是否安装
- `QT_IM_MODULE`、`XMODIFIERS`、`GTK_IM_MODULE` 是否正确
- `fcitx5.service` 是否运行
- `~/.config/fcitx5/profile` 里是否有 `DefaultIM=pinyin`

手动切中文：

```bash
fcitx5-remote -o
```

### 2. Noctalia 壁纸覆盖 niri

解决思路：让 `swaybg` 管壁纸，Noctalia 只管 Shell 和通知。

```json
{
  "wallpaper": {
    "enabled": false
  },
  "noctaliaPerformance": {
    "disableWallpaper": true
  }
}
```

niri 里加：

```kdl
layer-rule {
    match namespace="^wallpaper$"
    place-within-backdrop true
}
```

### 3. 解锁后黑屏一会

前的 `swayidle` 是 600 秒锁屏，601 秒关显示器。锁屏后马上关屏会导致解锁时重新唤醒输出，出现短暂黑屏。

解决：不要自动 `power-off-monitors`，只保留锁屏。手动关屏用快捷键：

```kdl
Mod+Shift+P { power-off-monitors; }
```

### 4. 截图失败

不要依赖单一工具。niri 内置截图、Flameshot 在不同 Wayland 环境里表现不一定稳定。`grim + slurp + satty + wl-copy` 更可控。

### 5. Windows 启动项失败

`boot.loader.systemd-boot.windows` 会通过 EDK2 Shell 的 `FS1:`、`FS2:` 之类句柄跳转。如果固件映射不稳定，可能报“找不到可执行文件”。

我的最终方案是复制 Windows EFI 文件到 NixOS ESP，然后让 systemd-boot 直接启动 `/EFI/Microsoft/Boot/bootmgfw.efi`。

### 6. 国内缓存源问题

有时候 SJTU 镜像 `.narinfo` HTTP 500，最后移除了 SJTU，只保留：

```nix
[
  "https://mirrors.ustc.edu.cn/nix-channels/store?priority=10"
  "https://mirrors.tuna.tsinghua.edu.cn/nix-channels/store?priority=20"
  "https://hyprland.cachix.org?priority=30"
  "https://cache.nixos.org?priority=40"
]
```

### 7. Docker 免 sudo

配置里加：

```nix
virtualisation.docker.enable = true;
users.users.cachetide.extraGroups = [ "docker" ];
```

然后重新登录，或者：

```bash
newgrp docker
```

### 8. zsh 每次都要 source `.zshrc`

这通常是当前登录 shell 还不是 zsh。NixOS 里不要手动 `chsh`，直接写进系统配置：

```nix
programs.zsh.enable = true;
users.users.cachetide.shell = pkgs.zsh;
```

rebuild 后完整退出登录再进入，`echo $SHELL` 应该显示 `/run/current-system/sw/bin/zsh` 或指向 zsh 的路径。

## 13. 最后检查清单

重启前检查：

```bash
niri validate
nix eval /home/cachetide/nixos-noctalia#nixosConfigurations.nixos.config.system.build.toplevel.drvPath --raw
sudo nixos-rebuild boot --flake /home/cachetide/nixos-noctalia#nixos
```

进入桌面后检查：

```bash
systemctl --user status noctalia-shell.service
systemctl --user status fcitx5.service
systemctl --user status swayidle.service
fcitx5-remote
docker version
```

如果这些都正常，一个完整可用的 NixOS + niri + Noctalia Shell 桌面就完成了。

*本文是ai辅助安装后要求ai总结的成果*

*~~（在用了nixos一段时间后还是转fedora去了，主要是不习惯吧，随时build挺麻烦的，但是我确实很喜欢nixos的理念）~~*
