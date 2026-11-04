#!/usr/bin/env python3
"""Gera somente a arte do fundo etéreo misto: sem textos ou interface.
A posição vertical de cada efeito corresponde ao relógio de 00h a 24h.
Dependência de desenvolvimento: Pillow; o PWA consome somente o WebP pronto.
"""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import math
import random

W, H = 640, 2560
random.seed(114)
T = H / 24
COLORS = [
    (0.0, '#c5c5f4'),
    (2.0, '#d6d0f6'),
    (4.2, '#f5d6ed'),
    (5.8, '#ffdece'),
    (7.1, '#fff1c9'),
    (9.2, '#e4ddff'),
    (11.0, '#cbe9ff'),
    (13.2, '#c5e6ff'),
    (15.1, '#d7d1fa'),
    (16.9, '#f6d4eb'),
    (18.1, '#ffbfc0'),
    (19.5, '#f3c3ed'),
    (21.0, '#dbccff'),
    (24.0, '#c1d7fa'),
]
def rgb(h):
    return tuple(int(h[i:i+2],16) for i in (1,3,5))
stops=[(h,rgb(c)) for h,c in COLORS]
def lerp(a,b,t):
    return tuple(round(a[i]+(b[i]-a[i])*t) for i in range(3))
canvas=Image.new('RGB',(W,H))
d=ImageDraw.Draw(canvas)
si=0
for y in range(H):
    hr=y/T
    while si<len(stops)-2 and hr>stops[si+1][0]:
        si+=1
    h1,c1=stops[si];h2,c2=stops[si+1]
    tint=lerp(c1,c2,min(1,max(0,(hr-h1)/(h2-h1))))
    d.line([(0,y),(W,y)],fill=tint)
canvas=canvas.convert('RGBA')

def bloom(cx,hr,rx,rh,color,opacity,softness=0.30):
    global canvas
    x=int(cx*W);y=int(hr*T);hw=int(rx*W);hh=int(rh*T)
    mask=Image.new('L',(W,H))
    md=ImageDraw.Draw(mask)
    md.ellipse((x-hw,y-hh,x+hw,y+hh),fill=opacity)
    mask=mask.filter(ImageFilter.GaussianBlur(max(3,int(min(hw,hh)*softness))))
    layer=Image.new('RGBA',(W,H),rgb(color)+(0,))
    layer.putalpha(mask)
    canvas=Image.alpha_composite(canvas,layer)

# Nuvens amplas, não geométricas; fontes quentes e frias se cruzam.
for args in [
    (.90,1.4,.70,2.5,'#828df5',115,.43),
    (.20,3.1,.68,2.3,'#f1a6d7',90,.38),
    (.49,5.65,.74,1.65,'#ff9e91',138,.37),
    (.32,6.6,.53,1.6,'#ffbb64',140,.44),
    (.20,8.1,.46,1.1,'#f8b2da',82,.39),
    (.12,11.0,.67,3.0,'#8cbdff',110,.40),
    (.78,12.1,.65,2.5,'#a6e8ff',100,.43),
    (.42,15.1,.80,2.3,'#b8b8fc',91,.39),
    (.14,17.1,.69,2.1,'#fa90b6',138,.39),
    (.69,18.25,.59,2.0,'#ff9a6d',136,.44),
    (.32,19.3,.68,2.0,'#e9a1df',119,.39),
    (.90,22.3,.68,2.3,'#8baaff',111,.42),
    (.24,23.4,.52,2.2,'#ecaff4',101,.39),
]:
    bloom(*args)

# Luminosidade do amanhecer e pontos etéreos, sem objetos realistas pesados.
bloom(.32,6.8,.40,1.0,'#fff8b9',180,.50)
bloom(.30,6.75,.14,.37,'#fffdf0',115,.70)
bloom(.79,1.8,.16,.45,'#fff8ff',105,.42)
bloom(.62,18.75,.30,.85,'#ffda9c',101,.59)

# Arcos delicados no céu.
veil=Image.new('RGBA',(W,H),(0,0,0,0))
vd=ImageDraw.Draw(veil)
def bezier(points,n=100):
    p0,p1,p2,p3=points
    out=[]
    for i in range(n+1):
        t=i/n;u=1-t
        x=u**3*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t**3*p3[0]
        y=u**3*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t**3*p3[1]
        out.append((int(x),int(y)))
    return out
vd.line(bezier([(-40,3.0*T),(.28*W,1.0*T),(.68*W,2.5*T),(W+40,1.15*T)]),fill=(255,250,255,83),width=2,joint='curve')
vd.line(bezier([(-45,8.9*T),(.25*W,8.0*T),(.74*W,9.25*T),(W+30,7.6*T)]),fill=(255,253,251,58),width=2,joint='curve')
vd.line(bezier([(-50,18.75*T),(.38*W,16.55*T),(.79*W,17.1*T),(W+35,16.5*T)]),fill=(255,246,246,63),width=2,joint='curve')

# Pétalas quase abstratas e transparentes na faixa de entardecer.
floral=Image.new('RGBA',(W,H),(0,0,0,0))
fd=ImageDraw.Draw(floral)
def petal(base,tip,bend1,bend2,color):
    center=bezier([base,bend1,bend2,tip],60)
    back=bezier([tip,(tip[0]+45,tip[1]+105),(base[0]-15,base[1]+45),base],60)
    fd.polygon(center+back,fill=color)
petal((W*1.04,19.05*T),(.59*W,15.0*T),(.78*W,18.25*T),(.50*W,16.1*T),(255,218,246,41))
petal((W*1.02,19.1*T),(.49*W,17.45*T),(.88*W,17.6*T),(.61*W,17.0*T),(255,236,214,51))
petal((W*1.05,19.2*T),(.62*W,20.0*T),(.82*W,20.1*T),(.61*W,19.2*T),(255,194,226,47))
petal((W*1.08,18.2*T),(.80*W,15.6*T),(.96*W,17.4*T),(.72*W,16.4*T),(255,231,240,35))
canvas=Image.alpha_composite(canvas,floral.filter(ImageFilter.GaussianBlur(23)))
canvas=Image.alpha_composite(canvas,veil)

# Lua translúcida, bastante pequena em relação à composição.
moon=Image.new('RGBA',(W,H),(0,0,0,0))
mo=ImageDraw.Draw(moon)
mx,my=int(.89*W),int(1.75*T)
radius=int(W*.035)
mo.ellipse((mx-radius,my-radius,mx+radius,my+radius),fill=(255,253,255,139))
moonGlow=moon.filter(ImageFilter.GaussianBlur(18))
canvas=Image.alpha_composite(canvas,moonGlow)
canvas=Image.alpha_composite(canvas,moon)

# Estrelas discretas de quatro pontas, espacialmente pouco numerosas.
stars=Image.new('RGBA',(W,H),(0,0,0,0))
sd=ImageDraw.Draw(stars)
for i in range(38):
    hour=random.uniform(.4,23.7)
    x=random.randint(int(W*.25),W-15)
    y=int(hour*T)
    s=random.choice([2,3,4])
    a=random.randint(52,110)
    sd.line([(x-s,y),(x+s,y)],fill=(255,252,255,a),width=1)
    sd.line([(x,y-s),(x,y+s)],fill=(255,252,255,a),width=1)
    sd.ellipse((x-1,y-1,x+1,y+1),fill=(255,255,255,min(190,a+55)))
canvas=Image.alpha_composite(canvas,stars.filter(ImageFilter.GaussianBlur(5)))
canvas=Image.alpha_composite(canvas,stars)

# Véu perolado leve aumenta a leitura sem apagar a composição.
mask=Image.new('L',(W,H))
m=ImageDraw.Draw(mask)
for x in range(W):
    a=int(8+13*x/W)
    m.line((x,0,x,H),fill=a)
pearl=Image.new('RGBA',(W,H),(255,253,252,0))
pearl.putalpha(mask)
canvas=Image.alpha_composite(canvas,pearl)
out=Path('assets/etero-misto-24h.webp')
canvas.convert('RGB').save(out,format='WEBP',quality=88,method=6)
print(f'ARTE_OK {out} {out.stat().st_size:,} bytes ({W}×{H})')
