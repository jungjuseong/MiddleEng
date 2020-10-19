import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';

import * as _ from 'lodash';

import { observable, trace } from 'mobx';
import * as kutil from '@common/util/kutil';
import * as keyboard from '@common/component/Keyboard';
import * as StrUtil from '@common/util/StrUtil';
import './KTextDiv.scss';
import { node } from 'prop-types';

const SHY = String.fromCharCode(173);

const shiftMap: Array<string|undefined> = [];
shiftMap[32] = ' ';
shiftMap[48] = ')';
shiftMap[49] = '!';
shiftMap[50] = '@';
shiftMap[51] = '#';
shiftMap[52] = '$';
shiftMap[53] = '%';
shiftMap[54] = '^';
shiftMap[55] = '&';
shiftMap[56] = '*';
shiftMap[57] = '(';
shiftMap[59] = ':';
shiftMap[61] = '+';
shiftMap[65] = 'A';
shiftMap[66] = 'B';
shiftMap[67] = 'C';
shiftMap[68] = 'D';
shiftMap[69] = 'E';
shiftMap[70] = 'F';
shiftMap[71] = 'G';
shiftMap[72] = 'H';
shiftMap[73] = 'I';
shiftMap[74] = 'J';
shiftMap[75] = 'K';
shiftMap[76] = 'L';
shiftMap[77] = 'M';
shiftMap[78] = 'N';
shiftMap[79] = 'O';
shiftMap[80] = 'P';
shiftMap[81] = 'Q';
shiftMap[82] = 'R';
shiftMap[83] = 'S';
shiftMap[84] = 'T';
shiftMap[85] = 'U';
shiftMap[86] = 'V';
shiftMap[87] = 'W';
shiftMap[88] = 'X';
shiftMap[89] = 'Y';
shiftMap[90] = 'Z';
shiftMap[96] = '0';
shiftMap[97] = '1';
shiftMap[98] = '2';
shiftMap[99] = '3';
shiftMap[100] = '4';
shiftMap[101] = '5';
shiftMap[102] = '6';
shiftMap[103] = '7';
shiftMap[104] = '8';
shiftMap[105] = '9';
shiftMap[106] = '*';
shiftMap[107] = '+';
shiftMap[109] = '_';
shiftMap[107] = '+';
shiftMap[111] = '/';
shiftMap[186] = ':';
shiftMap[187] = '+';
shiftMap[188] = '<';
shiftMap[189] = '_';
shiftMap[190] = '>';
shiftMap[191] = '?';
shiftMap[192] = '~';
shiftMap[219] = '{';
shiftMap[220] = '|';
shiftMap[221] = '}';
shiftMap[222] = '\'';

const charMap: Array<string|undefined> = [];
charMap[32] = ' ';
charMap[48] = '0';
charMap[49] = '1';
charMap[50] = '2';
charMap[51] = '3';
charMap[52] = '4';
charMap[53] = '5';
charMap[54] = '6';
charMap[55] = '7';
charMap[56] = '8';
charMap[57] = '9';
charMap[59] = ';';
charMap[61] = '=';
charMap[65] = 'a';
charMap[66] = 'b';
charMap[67] = 'c';
charMap[68] = 'd';
charMap[69] = 'e';
charMap[70] = 'f';
charMap[71] = 'g';
charMap[72] = 'h';
charMap[73] = 'i';
charMap[74] = 'j';
charMap[75] = 'k';
charMap[76] = 'l';
charMap[77] = 'm';
charMap[78] = 'n';
charMap[79] = 'o';
charMap[80] = 'p';
charMap[81] = 'q';
charMap[82] = 'r';
charMap[83] = 's';
charMap[84] = 't';
charMap[85] = 'u';
charMap[86] = 'v';
charMap[87] = 'w';
charMap[88] = 'x';
charMap[89] = 'y';
charMap[90] = 'z';
charMap[96] = '0';
charMap[97] = '1';
charMap[98] = '2';
charMap[99] = '3';
charMap[100] = '4';
charMap[101] = '5';
charMap[102] = '6';
charMap[103] = '7';
charMap[104] = '8';
charMap[105] = '9';
charMap[106] = '*';
charMap[107] = '+';
charMap[109] = '_';
charMap[107] = '+';
charMap[111] = '/';
charMap[186] = ';';
charMap[187] = '=';
charMap[188] = ',';
charMap[189] = '-';
charMap[190] = '.';
charMap[191] = '/';
charMap[192] = '`';
charMap[219] = '[';
charMap[220] = '\\';
charMap[221] = ']';
charMap[222] = '\'';

function _getSelectPosition(div: HTMLElement) {
  const ret = {start: 0, end: 0};
  const selection = window.getSelection();
  if (selection && selection.getRangeAt && selection.rangeCount) {
    const range_o = selection.getRangeAt(0);

    if(range_o.startContainer === div && range_o.endContainer === div) {
      ret.end = range_o.endOffset;
      ret.start =  range_o.startOffset;
    } else {
      const lenSelected = range_o.toString().length;
      const range = range_o.cloneRange();
      range.selectNodeContents(div);
      range.setEnd(range_o.endContainer, range_o.endOffset);

      ret.end = range.toString().length;
      ret.start = ret.end - lenSelected;
      range.detach();
    }
  }
  return ret;
}

interface IKTextDiv {
  view: boolean;
  on: boolean;
  tabIndex: number;
  disabled?: boolean;
  value?: string;
  placeholder?: string;
  isPoint?: boolean;
  className?: string;
  maxLength?: number;
  maxLine?: number;
  onRef?: (tabIndex: number, input: KTextDiv) => void;
  onChange?: (tabIndex: number, text: string) => void;
  onPrev?: (tabIndex: number) => void;
  onNext?: (tabIndex: number) => void;
  onEnter?: (tabIndex: number) => void;
  onDone?: (tabIndex: number) => void;
  onFocus?: (tabIndex: number) => void;
  onCaret?: (tabIndex: number, el: HTMLElement) => void;
  onLimit?: () => void;
}

@observer
export class KTextDiv extends React.Component<IKTextDiv> implements keyboard.IContentEditable {
  private _div?: HTMLDivElement;
  public get div() {return this._div;}
  @observable private _editable = true;

  @observable private _empty = true;

  private _textShy = '';
  private _text = '';
  public get text() {return this._text;}
  private _selStart = 0;
  private _selEnd = 0;
  private _lineHeight = 0;
  private _lineNum = 0;
  private _delayCalc: () => void;
  private _chagedSelection: () => void;

  constructor(props: IKTextDiv) {
    super(props);
    if(props.onRef) props.onRef( props.tabIndex, this);

    this._delayCalc = _.throttle(() => {
      this._calc(false);
    }, 5);

    this._chagedSelection = _.debounce(() => {
      if(!this.props.on) return;
      else if(!this._div) return;

      if(document.activeElement !== this._div) this._div.focus();
      const selection = window.getSelection();
      if(!selection) return;

      if(selection.focusNode === this._div) {
        if(this.props.onCaret) {
          this.props.onCaret(this.props.tabIndex, this._div);
        }
      }
    }, 50);
  }

  private _calc(isAdded: boolean) {
    if(!this.props.on) return;
    else if(!this._div) return;
    const div = this._div;
    let textShy = div.textContent;
    if(!textShy) textShy = '';

    if(this._textShy !== textShy) {
      let text = textShy.replace(new RegExp(SHY, 'g'), '');
      this._empty = text === '';
  
      const selection = window.getSelection();
      if (!selection || !selection.getRangeAt || !selection.rangeCount) return;
  
      if(this._empty) {
        this._clearText(selection);
        if(this.props.onChange) this.props.onChange(this.props.tabIndex, this._text);
        return;
      }
      const range_o = selection.getRangeAt(0);


      let isOk = true;
      if(this.props.maxLength && this.props.maxLength > 0) {
        if(text.length > this.props.maxLength) isOk = false;
      } 
      if(this.props.maxLine && this.props.maxLine > 0) {
        if(this._lineHeight === 0) {
          const ss = window.getComputedStyle(div);
          const lHeight = ss.lineHeight;
          if(!lHeight) this._lineHeight = 0;
          else if(lHeight.endsWith('px')) this._lineHeight = StrUtil.nteUInt(lHeight, 0);
          else if(lHeight.endsWith('%')) this._lineHeight = StrUtil.nteUInt(lHeight, 0) * StrUtil.nteUInt(ss.fontSize, 0);
          else this._lineHeight = 0;
        }
        
        if(this._lineHeight > 0) {
          const rect = div.getBoundingClientRect();
          let lineNum = Math.round((rect.bottom - rect.top) / this._lineHeight);

          if(lineNum > this.props.maxLine) {
            isOk = false;
            lineNum = this.props.maxLine;
          }
          this._lineNum = lineNum;
        }
      }

      
      if(isOk) {
        const sel = _getSelectPosition(div);
        this._text = text;

        this._selEnd = sel.end;
        this._selStart = this._selEnd;
      } else {
        textShy = this._textShy;
        text = this._text;
        if(isAdded && this.props.onLimit) this.props.onLimit();
      }
      while(this._div.lastChild) this._div.removeChild(this._div.lastChild);

      let tlen = 0;
      this._textShy = '';
      for(let i = 0; i < textShy.length; i++) {
        const char = textShy.charAt(i);
        if(char === SHY) {
          if(tlen < this._selEnd) this._selEnd--;
        } else {
          this._div.appendChild(document.createTextNode(char));
          this._textShy += char;
          tlen++;
          if(!this.props.isPoint && char === '\n') {
            if(tlen <= this._selEnd) this._selEnd++;
            this._div.appendChild(document.createTextNode(SHY));
            this._textShy += SHY;
            tlen++;
          }
        }
      }
      
      if(this._selEnd > textShy.length) this._selEnd = textShy.length;
      selection.setPosition(this._div, this._selEnd);
      if(this.props.onChange) this.props.onChange(this.props.tabIndex, this._text);
    }
  }


  private _insertString(str: string) {
    const selection = window.getSelection();
    if (selection && selection.getRangeAt && selection.rangeCount) {
      const range_o = selection.getRangeAt(0);
      const range = range_o.cloneRange();
      range.deleteContents();
      range.insertNode( document.createTextNode(str) );
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      range_o.detach();
    } 
  }

  private _clearText(selection: Selection|null) {
    if(this._div) {
      while(this._div.lastChild) this._div.removeChild(this._div.lastChild);
      if(!this.props.isPoint) this._div.appendChild(document.createTextNode(SHY));
      if(selection) selection.setPosition(this._div, 0);

    }
    this._lineNum = 0;
    this._selStart = 0;
    this._selEnd = 0;
    this._text = '';
    this._textShy = this.props.isPoint ? '' : SHY;
    this._empty = true;
  }

  private _clear() {
    const selection = window.getSelection();
    this._clearText(selection);
    this._editable = true;
    this._lineHeight = 0;
  }

  private _onRef = (div: HTMLDivElement) => {
    if(this._div || !div) return;
    this._div = div;
    const downFnc = (evt: Event) => {
      if(!this.props.view) return;
      if(document.activeElement !== div) div.focus();
      evt.stopImmediatePropagation();

      const sel = _getSelectPosition(div);
      this._selStart = sel.end;
      this._selEnd = sel.end;
      const selection = window.getSelection();
      if(selection) selection.setPosition(div, sel.end);
      this._chagedSelection();
    };
    const upFnc = (evt: Event) => {
      if(!this.props.view) return;
      if(document.activeElement !== div) div.focus();
      evt.stopImmediatePropagation();


      const sel = _getSelectPosition(div);
      this._selStart = sel.end;
      this._selEnd = sel.end;
      const selection = window.getSelection();
      if(selection) selection.setPosition(div, sel.end);
      this._chagedSelection();
    };
    div.addEventListener('mousedown', downFnc);
    div.addEventListener('pointerdown', downFnc);
    div.addEventListener('touchdown', downFnc);

    div.addEventListener('mouseun', upFnc);
    div.addEventListener('pointerup', upFnc);
    div.addEventListener('touchup', upFnc);

    document.addEventListener('selectionchange', (evt) => {
      if(this.props.on) {
        
        this._chagedSelection();
      }
    });
  }

  public focus() {
    if(!this._div) return;
    
    if(document.activeElement !== this._div) this._div.focus();


    const selection = window.getSelection();
    if(!selection) return;
    console.log('public focus()', this._selEnd);
    if(selection.focusNode !== this._div) {
      selection.setPosition(this._div, this._selEnd);
    }

  }

  public keyDown = (keyCode: number, chr?: string) => {
    if(!this.props.on) return;
    
    if(this._div && document.activeElement !== this._div) this._div.focus();

    if(keyCode === 13 ) {                                       // ENTER
      if(this.props.isPoint) {
        if(this.props.onLimit) this.props.onLimit();
      } else {
        if(this.props.maxLine && this.props.maxLine > 0 && this._lineNum >= this.props.maxLine) {
          if(this.props.onLimit) this.props.onLimit();
        } else {
          this._insertString('\n');
          this._insertString(SHY);
          this._calc(true);     
        }
      }
    } else if(keyCode === 8) {                // 
      this._backspace();
    } else if(keyCode === 9) {                // 
      this._tab();
    } else if(keyCode === 37 || keyCode === 39) {               // 
      this._moveCaret(keyCode === 37 ? -1 : 1);
    } else if(keyCode === 46) {               // 
      this._delete();
    } else if(chr) {
      if(this.props.isPoint) {
        if('0123456789'.indexOf(chr) >= 0) {
          this._insertString(chr);
          this._calc(true);
        } else if(this.props.onLimit) this.props.onLimit();
      } else {
        this._insertString(chr);
        this._calc(true);
      }
    }
    
  }
  public done = () => {
    if(this.props.onDone) this.props.onDone(this.props.tabIndex);
  }

  private _onFocus = () => {
    if(!this.props.view) return;
    if(this.props.onFocus) {
      this.props.onFocus(this.props.tabIndex);
    }
    keyboard.setInputs(this);
  }
  private _onBlur = () => {
    _.delay(() => {
      if(this.props.on) {
        console.log('b=>_onBlur');
        if(this._div && document.activeElement !== this._div) this._div.focus();
      }
    }, 20);
  }

  private _onInput = async (evt: React.FormEvent) => {
    // TO CHECK
  }

  private _prevent = (evt: any) => evt.preventDefault();
  
  private _onKeyDown = (evt: React.KeyboardEvent) => {
    if(evt.ctrlKey || evt.altKey) return;
    let charFromMap;
    let isShift;

    if(evt.keyCode >= 65 && evt.keyCode <= 90) {
      const capslock = evt.getModifierState('CapsLock');
      isShift = (evt.shiftKey && !capslock) || (!evt.shiftKey && capslock);
    } else isShift = evt.shiftKey;
    
    if(isShift) charFromMap = shiftMap[evt.keyCode];
    else charFromMap = charMap[evt.keyCode];

    this.keyDown(evt.keyCode, charFromMap);
    evt.preventDefault();
  }

  private _moveCaret(dir: -1|1) {
    if(!this._div) return;
    const div = this._div;
    const textContent = div.textContent;
    const selection = window.getSelection();
    if (selection && selection.getRangeAt && selection.rangeCount && textContent) {
      let offset;
      const sel = _getSelectPosition(div);

      if(dir === 1) {
        let textLen = textContent.length;
        offset = sel.end + 1;
        while(offset < textLen && textContent.charAt(offset) === SHY) {
          offset++;
        }
        if(offset > textLen) {
          this._selStart = textLen;
          this._selEnd = textLen;
          if(this.props.onNext) this.props.onNext(this.props.tabIndex);
          return;
        }
        try {
          this._selStart = offset;
          this._selEnd = offset;
          console.log('a==> _moveCaret selection.setPosition', offset);
          selection.setPosition(div, offset);
        } catch(e) {}
      } else {
        offset = sel.start - 1;
        while(offset > 0 && textContent.charAt(offset) === SHY) {
          offset--;
        }
        if(offset < 0) {
          this._selStart = 0;
          this._selEnd = 0;
          if(this.props.onPrev) this.props.onPrev(this.props.tabIndex);
          return;
        }
        try {
          this._selStart = offset;
          this._selEnd = offset;
          console.log('b==> _moveCaret selection.setPosition', offset);
          selection.setPosition(div, offset);
        } catch(e) {}       
      }
    }
  }

  private _backspace() {
    if(!this._div) return;
    const div = this._div;
    const textContent = div.textContent;

    const selection = window.getSelection();
    if (selection && selection.getRangeAt && selection.rangeCount && textContent) {
      const range_o = selection.getRangeAt(0);
      if(range_o.startContainer === range_o.endContainer && Math.abs(range_o.endOffset - range_o.startOffset) === 0) {

        const sel = _getSelectPosition(div);

        while(sel.start > 0) {
          sel.start--;
          if(textContent.charAt(sel.start) !== SHY) break;
        }

        if(sel.start >= 0 && sel.start < sel.end) {
          range_o.setStart(div, sel.start);
          range_o.setEnd(div, sel.end);
          range_o.deleteContents();
          this._calc(false);
        } else if(sel.start < 0 || (sel.start === 0 && sel.end === 0)) {
          if(this.props.onPrev) this.props.onPrev(this.props.tabIndex);
        }
      } else {
        range_o.deleteContents();
        this._calc(false);
      }
    }
  }
  private _delete() {
    if(!this._div) return;
    const div = this._div;
    const textContent = div.textContent;

    const selection = window.getSelection();
    if (selection && selection.getRangeAt && selection.rangeCount && textContent) {
      const range_o = selection.getRangeAt(0);
      if(range_o.startContainer === range_o.endContainer && Math.abs(range_o.endOffset - range_o.startOffset) === 0) {
        const sel = _getSelectPosition(div);
        const textLen = textContent.length;
        while(sel.end < textLen) {
          sel.end++;
          if(textContent.charAt(sel.end) !== SHY) break;
        }

        if(sel.end <= textLen) {
          range_o.setStart(div, sel.start);
          range_o.setEnd(div, sel.end);
          range_o.deleteContents();
          this._calc(false);
        }
      } else {
        range_o.deleteContents();
        this._calc(false);
      }
    }
  }
  private _tab() {
    if(this.props.onNext) this.props.onNext(this.props.tabIndex);
  }

  public componentDidMount() {
    this._clear();
  }
  public componentDidUpdate(prev: IKTextDiv) {
    if(this.props.view && !prev.view) {
      this._clear();
    } else if(!this.props.view && prev.view) {
      this._clear();
    }

    if(this.props.on && !prev.on) {
      if(this._div) {
        if(document.activeElement !== this._div) this._div.focus();
        const sel = _getSelectPosition(this._div);
        this._selStart = sel.start;
        this._selEnd = sel.end;
      }
      keyboard.setInputs(this);
      this._chagedSelection();
    }
  }

  public render() {
    const {className, isPoint, maxLength} = this.props;
    const arr: string[] = ['k-input-div'];
    if(this.props.on) arr.push('on');
    
    if(className) arr.push(className);

    const style: React.CSSProperties = {touchAction: 'none'};
    if(isPoint) {
      const max = (maxLength && maxLength > 0) ? maxLength : 2;
      style.display = 'inline-block';
      style.minWidth =  (max * 30) + 'px';
      style.textAlign = 'center';
      arr.push('point');
    } else {
      style.display = 'inline';
      arr.push('normal');
    }

    if(this._empty) arr.push('empty');
    
    return (
      <div 
        className={arr.join(' ')}
        style={style}
        ref={this._onRef} 
        contentEditable={this._editable} 
        onFocus={this._onFocus} 
        onBlur={this._onBlur}
        onInput={this._onInput} 
        
        onPaste={this._prevent}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        onKeyDown={this._onKeyDown}
        onKeyPress={this._prevent}
        onKeyUp={this._prevent}
        data-placeholder={this.props.placeholder}
      />
    );
  }
}