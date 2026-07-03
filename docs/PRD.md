# PRD - skiller

## 背景信息

我的电脑上安装了各种Agent，例如Claude code、Codex、Trae、OpenCode、OpenClaw等。每个Agent安装了不同的Skills。有的Skill的scope是user的、有的是Project的。使用CLI进入不同agent的skill目录查看、管理Skills十分不方便，因为，我希望开发一个工具，来统一、可视化管理Agent Skills。

我为这个工具取名skiller，我将在当前目录下开发这个工具。

首先，我进行了调研，发现了一个管理Skills的开源项目：https://github.com/xingkongliang/skills-manager。我已经把这个项目下载到当前目录了，请你分析下这个项目，后续我将基于这个项目进行二次开发