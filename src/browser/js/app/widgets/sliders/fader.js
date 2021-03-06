var {clip, mapToScale} = require('../utils'),
    _sliders_base = require('./_sliders_base')


module.exports = class Fader extends _sliders_base {

    static defaults() {

        return {
            type:'fader',
            id:'auto',
            linkId:'',

            _style:'style',

            label:'auto',
            unit:'',
            left:'auto',
            top:'auto',
            width:'auto',
            height:'auto',
            alignRight:false,
            horizontal:false,
            pips:true,
            compact:false,
            color:'auto',
            css:'',

            _behaviour:'behaviour',

            snap:false,
            spring:false,
            doubleTap:false,

            _osc:'osc',

            range:{min:0,max:1},
            origin: 'auto',
            value:'',
            logScale:false,
            precision:2,
            meter:false,
            address:'auto',
            touchAddress:'',
            meterAddress:'',
            preArgs:[],
            target:[]
        }

    }

    constructor(options) {

        super(options)

        this.widget.addClass('fader')
        this.margin = 15


        if (this.getProp('horizontal')) {
            this.widget.add(this.container).addClass('horizontal')
            if (this.getProp('width') == 'auto' && this.getProp('left') != 'auto') {
                this.container.css({'width':'auto', 'right':'0'})
            }
        } else {
            if (this.getProp('height') == 'auto' && this.getProp('top') != 'auto') {
                this.container.css({'height':'auto', 'bottom':'0'})
            }
        }

        if (this.getProp('compact')) {
            this.widget.addClass('compact')
            this.margin = 0
        }

        if (this.getProp('alignRight') && !this.getProp('horizontal')) {
            this.widget.addClass('align-right')
        }

        if (this.getProp('pips') && !this.getProp('compact')) {

            this.widget.addClass('has-pips')

            var pips = $('<div class="pips"></div>').appendTo(this.wrapper)
            var pipTexts = {}
            for (var k in this.rangeKeys) {
                pipTexts[this.rangeKeys[k]]=this.rangeLabels[k]
            }

            var pipsInner = ''
            for (var i=0;i<=100;i++) {
                if (pipTexts[i]==undefined) continue

                var pos = this.getProp('horizontal')?'left':'bottom';

                var piptext = `<span>${Math.abs(pipTexts[i])>=1000?pipTexts[i]/1000+'k':pipTexts[i]}</span>`

                var add = `
                <div class="pip val" style="${pos}:${i}%">${piptext}</div>
                `
                pipsInner = pipsInner + add
            }
            pips[0].innerHTML = pipsInner
        }


        if (this.getProp('meter')) {
            var parsewidgets = require('../../parser').widgets
            var data = {
                type:'meter',
                id: this.getProp('id') + '/meter',
                label:false,
                horizontal:this.getProp('horizontal'),
                range:this.getProp('range'),
                logScale:this.getProp('logScale'),
                address:this.getProp('meterAddress') || this.getProp('address') + '/meter',
                preArgs:this.getProp('preArgs'),
                color:this.getProp('color'),
                pips:this.getProp('pips')
            }
            var element = parsewidgets([data],this.wrapper, this.parent)
            element[0].classList.add('not-editable')
            this.widget[0].classList.add('has-meter')
        }

    }

    draginitHandle(e, data, traversing) {

        super.draginitHandle(...arguments)

        this.percent = clip(this.percent,[0,100])

        if (!(traversing || this.getProp('snap'))) return

        this.percent = this.getProp('horizontal')?
        (data.offsetX - this.margin * PXSCALE) / (this.width - (this.margin * PXSCALE * 2)) * 100:
        (this.height - data.offsetY - this.margin * PXSCALE) / (this.height - (this.margin * PXSCALE * 2)) * 100

        // this.percent = clip(this.percent,[0,100])

        this.setValue(this.percentToValue(this.percent), {send:true,sync:true,dragged:true})

    }

    dragHandle(e, data) {

        super.dragHandle(...arguments)

        this.percent = this.getProp('horizontal')?
        this.percent + ( data.speedX/(this.width - this.margin * PXSCALE * 2)) * 100:
        this.percent + (-data.speedY/(this.height - this.margin * PXSCALE * 2)) * 100

        this.setValue(this.percentToValue(this.percent), {send:true,sync:true,dragged:true})

    }

    percentToCoord(percent) {

        if (this.getProp('horizontal')) {
            return clip(percent / 100,[0,1]) * (this.width - 2 * PXSCALE * this.margin)
        } else {
            return (this.height - this.margin * PXSCALE) - clip(percent / 100, [0,1]) * (this.height - 2 * PXSCALE * this.margin)
        }

    }

    resizeHandle(){
            super.resizeHandle(...arguments)

            if (this.getProp('compact') && (!this.getProp('pips') || this.rangeKeys.length == 2)) {
                if (this.getProp('horizontal')) {
                    this.canvas[0].setAttribute('height', 1)
                } else {
                    this.canvas[0].setAttribute('width', 1)
                }
            }

            if (CANVAS_SCALING != 1) this.ctx.scale(CANVAS_SCALING, CANVAS_SCALING)

    }


    draw() {

        var d = Math.round(this.percentToCoord(this.percent)),
        o = Math.round(this.percentToCoord(this.valueToPercent(this.originValue))),
        m = Math.round(this.getProp('horizontal') ? this.height / 2 : this.width / 2)

        this.clear()

        if (this.getProp('horizontal')) {
            if (this.getProp('compact')) {

                this.ctx.globalAlpha = 0.2 + 0.2 * Math.abs(d-o) / (d<o?o:this.width-o)
                this.ctx.strokeStyle = this.colors.gauge
                this.ctx.beginPath()
                this.ctx.moveTo(d, m)
                this.ctx.lineTo(o, m)
                this.ctx.lineWidth = this.height + 1
                this.ctx.stroke()


                if (this.getProp('pips') && this.rangeKeys.length > 2) {
                    this.ctx.lineWidth = 1 * PXSCALE
                    this.ctx.globalAlpha = 1
                    this.ctx.strokeStyle = this.colors.bg

                    var x,
                        min = Math.min(d,o),
                        max = Math.max(d,o)

                    this.ctx.beginPath()
                    for (var i = 1;i < this.rangeKeys.length - 1;i++) {
                        x = Math.round(this.percentToCoord(this.rangeKeys[i])) + 0.5
                        this.ctx.moveTo(x, 0)
                        this.ctx.lineTo(x, 4 * PXSCALE)
                        this.ctx.moveTo(x, this.height - 4 * PXSCALE)
                        this.ctx.lineTo(x, this.height)
                    }
                    this.ctx.stroke()
                }

                this.ctx.globalAlpha = 1
                this.ctx.beginPath()
                this.ctx.fillStyle = this.colors.knob
                this.ctx.rect(Math.min(d,this.width-PXSCALE), 0, PXSCALE, this.height)
                this.ctx.fill()

            } else {

                this.ctx.lineWidth = Math.round(2 * PXSCALE)

                this.ctx.beginPath()
                this.ctx.strokeStyle = this.colors.track
                this.ctx.moveTo(this.margin * PXSCALE, m)
                this.ctx.lineTo(this.width - this.margin * PXSCALE, m )
                this.ctx.stroke()

                this.ctx.beginPath()
                this.ctx.strokeStyle = this.colors.gauge
                this.ctx.moveTo(d + this.margin * PXSCALE, m)
                this.ctx.lineTo(o + this.margin * PXSCALE, m)
                this.ctx.stroke()

                this.ctx.fillStyle = this.colors.knob

                this.ctx.globalAlpha = 0.3
                this.ctx.arc(d + this.margin * PXSCALE, m, 10 * PXSCALE, Math.PI * 2, false)
                this.ctx.fill()
                this.ctx.globalAlpha = 1

                this.ctx.beginPath()
                this.ctx.arc(d + this.margin * PXSCALE, m, 4 * PXSCALE, Math.PI * 2, false)
                this.ctx.fill()

                this.clearRect = [0, this.height / 2 - 11 * PXSCALE, this.width, 22 * PXSCALE]

            }


        } else {

            if (this.getProp('compact')) {

                this.ctx.globalAlpha = 0.2 + 0.2 * Math.abs(d-o) / (d<o?o:this.height-o)
                this.ctx.strokeStyle = this.colors.gauge
                this.ctx.beginPath()
                this.ctx.moveTo(m, d)
                this.ctx.lineTo(m, o)
                this.ctx.lineWidth = this.width + 1
                this.ctx.stroke()

                if (this.getProp('pips') && this.rangeKeys.length > 2) {
                    this.ctx.lineWidth = 1 * PXSCALE
                    this.ctx.globalAlpha = 1
                    this.ctx.strokeStyle = this.colors.bg

                    var y,
                        min = Math.min(d,o),
                        max = Math.max(d,o)

                    this.ctx.beginPath()
                    for (var i = 1;i < this.rangeKeys.length - 1;i++) {
                        y = Math.round(this.percentToCoord(this.rangeKeys[i])) + 0.5
                        this.ctx.moveTo(0, y)
                        this.ctx.lineTo(4 * PXSCALE, y)
                        this.ctx.moveTo(this.width - 4 * PXSCALE, y)
                        this.ctx.lineTo(this.width, y)
                    }
                    this.ctx.stroke()
                }

                this.ctx.globalAlpha = 1
                this.ctx.beginPath()
                this.ctx.fillStyle = this.colors.knob
                this.ctx.rect(0, Math.min(d, this.height - PXSCALE), this.width, PXSCALE)
                this.ctx.fill()


            } else {

                this.ctx.lineWidth = Math.round(2 * PXSCALE)

                this.ctx.beginPath()
                this.ctx.strokeStyle = this.colors.track
                this.ctx.moveTo(m, this.margin * PXSCALE)
                this.ctx.lineTo(m, this.height - this.margin * PXSCALE)
                this.ctx.stroke()

                this.ctx.beginPath()
                this.ctx.strokeStyle = this.colors.gauge
                this.ctx.moveTo(m, d)
                this.ctx.lineTo(m, o)
                this.ctx.stroke()


                this.ctx.beginPath()
                this.ctx.fillStyle = this.colors.knob
                this.ctx.globalAlpha = 0.3
                this.ctx.arc(m, d, 10 * PXSCALE, Math.PI * 2,false)
                this.ctx.fill()
                this.ctx.globalAlpha = 1

                this.ctx.beginPath()
                this.ctx.arc(m, d, 4 * PXSCALE, Math.PI * 2,false)
                this.ctx.fill()

                this.clearRect = [this.width / 2 - 11 * PXSCALE, 0, 22 * PXSCALE, this.height]

            }
        }

    }

}
