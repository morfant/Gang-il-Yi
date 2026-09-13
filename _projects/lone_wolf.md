---
title: "Lone Wolf"
title_en: "Lone Wolf"
year: 2015
featured: true
type: performance
tags: [레이저, 게임, 오디오비주얼, 영상]   # 그래프 뷰 연결용 키워드 (협업자, 기법, 주제)
cover: /img/lone_wolf_0.png
media:
  - youtube: "kpuLvNyF_CU"
# CV 항목 (cv: exhibition|performance|dance|workshop|research|false)
cv: performance
period: "2015.12"
event: "오디오비주얼 페스티벌 〈WeSA 2015〉"
event_en: "WeSA 2015"
venue: "5.5 UNDER, 서울"
venue_en: "5.5 UNDER, Seoul"
role: "레이저 포인팅 FPS 멀티미디어 퍼포먼스"
role_en: "laser-pointing FPS multimedia performance"
---

레이저 포인팅 디텍션 시스템을 활용한 FPS 멀티미디어 퍼포먼스 &lt;Lone wolf&gt;. 오디오비주얼 페스티벌 &lt;WeSA&gt; 참여, 5.5 UNDER, 2015.12.

이 작업은 프로젝션 되는 큰 화면에 한 명의 퍼포머가 레이저 포인터를 이용하여 영상 속 목표물을 타겟팅하고 총을 쏘는 형식의, 게임의 요소를 빌린 오디오/비주얼 퍼포먼스이다.

제작에는 openframeworks, python OpenCV, 전동 비비탄 총, 레이저 포인터, 웹캠, 캡슐 마이크, Teensy, Xbee 등이 이용되었다. openCV 라이브러리(ofxOpenCV)를 이용하여 영상 중 특정 얼굴이나 동작형태의 외곽선을 추출하고, 그 형태에 2D 물리엔진인 Box2D 라이브러리의 chain shape을 이용하여 물리적 속성을 부여했다. 전동 비비탄 총과 레이저 포인터, 웹캠을 이용하여 방아쇠를 당기면 현재 레이저 포인터의 좌표를 전달하는 타켓팅 시스템을 구성했고, 총에 맞은 오브젝트들은 중심점에서 외곽선 위의 샘플링된 두 지점으로 이어지는 삼각형들의 연쇄 형태로 부서지도록 했다.

작업은 영상속의 얼굴을 가상의 추상적인 오브제로 만들어 보면 어떨까 하는 호기심에서 시작되었다.

그러한 가상/추상화 된 오브제에도 인격을 대표하는 상징으로서의 얼굴이 지니는 특성은 남아 있는 것처럼 느껴졌다. 그러나 그것이 실제하는 것을 복사한, 그리고 다시 쉽게 복제될 수 있는 ‘가상의 것’이기 때문에 그것을 모욕하는 것은 실제의 얼굴, 인격의 더 직접적인 상징이 되는 실제의 얼굴에 총을 쏘는 것과는 다른 지점이 있을 것이라고 생각했다. 그런 변명 가능한 지점을 파고들어 특정 얼굴들, 혹은 그것이 대변하는 인격들을 총쏘기 게임의 대상으로 만들었다.

소재가 된 인물들은 감정적이든 법적이든 그들에게 총을 쏘는 것이 금기시 되는 대상들이었다. 그럼에도 불구하고 총을 쏘았던 것은 그렇게 하는것이 예술적 표현의 영역에 있어서도 자유로울 수 없게 되었음을 비틀어 말하고 싶었던 이유를 포함한다.

제목인 lone wolf는 사회적 소외 등의 잠복적 원인으로 뜬금없는 총기난사 사건등을 일으키는 이들을 지칭하는 말에서 따온 것이다.

Laser-pointing FPS multimedia performance. WESA 2015, 5.5 UNDER, Seoul, 2015.

![](/img/lone_wolf_1.png)
![](/img/lone_wolf_2.png)
