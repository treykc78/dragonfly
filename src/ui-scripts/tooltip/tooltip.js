﻿var Tooltips = function() {};

Tooltips.CSS_TOOLTIP_SELECTED = "tooltip-selected";

(function()
{
  /* static methods of TooltipManager */

  this.register = function(name, keep_on_hover) {};
  this.unregister = function(name, tooltip) {};
  this.is_inside_tooltip = function(event, close_if_not_inside) {};

  var Tooltip = function(keep_on_hover, set_selected) 
  {
    this._init(keep_on_hover, set_selected);
  };

  Tooltip.prototype = new function()
  {
    /* interface */

    /**
      * Called if a node in the current mouseover parent node chaine of the
      * event target has a 'data-tooltip' value with the same name as this instance.
      * To show the tooltip the 'show' method must be called, mainly to
      * prevent that the tooltip is shown before it has content.
      */
    this.ontooltip = function(event, target){};
    
    /**
      * Called if the tooltip gets hidden.
      */
    this.onhide = function(){};

    this.ontooltipenter = function(){};

    this.ontooltipleave = function(){};

    this.ontoolclick = function(){};

    /**
      * To show the tooltip.
      * By default the tooltip is positioned in relation to the element
      * with the data-tooltip attribute, the tooltip-target. If the method 
      * is called with the optional 'box' argument that box is used 
      * instead to position the tooltip.
      * @param content {String or Template} The content for the tooltip. Optional.
      * If not set the 'data-tooltip-text' value on the target element will be 
      * used instead.
      * @param box The box to position the tooltip. Optional. The top, bottom, 
      * right and left property describe the position and dimension of the 
      * tooltip-target. Additionally the box needs a mouse_x and a mouse_y 
      * position. If the height of the tooltip-target is less than 1/3 of 
      * the window height, it is displayed above or beyond the tooltip-target, 
      * either on the left or the right side of the mouse-x position and vice 
      * versa if the hight is bigger. By default the box is created 
      * automatically with the mouse position and the target.
      */
    this.show = function(content, box){};

    /**
      * To hide the tooltip.
      */
    this.hide = function(){};

    this._init = function(keep_on_hover, set_selected)
    {
      this.keep_on_hover = keep_on_hover;
      this.set_selected = set_selected;
    }
    
    /* implementation */
    
    this.show = function(content, box)
    {
      _show_tooltip(this, content, box);
    };

    this.hide = function()
    {
      _hide_tooltip(this);
    };

    /**
      * Default implementation.
      */
    this.ontooltip = function(event, target)
    {
      this.show();
    };
  };

  /* constants */

  const DATA_TOOLTIP = "data-tooltip";
  const DATA_TOOLTIP_TEXT = "data-tooltip-text";
  const HIDE_DELAY = 120;
  const SHOW_DELAY = 110;
  const DISTANCE_X = 5;
  const DISTANCE_Y = 5;
  const MARGIN_Y = 15;
  const MARGIN_X = 30;

  /* private */

  var _contextmenu = null;
  var _tooltips = {};
  var _tooltip_ctxs = [];
  var _ctx_stack = [];
  var _cur_ctx = null;
  var _is_setup = false;

  var _window_width = 0;
  var _window_height = 0;
  var _padding_width = 0;
  var _padding_height = 0;

  var store_window_dimensions = function()
  {
    _window_width = window.innerWidth;
    _window_height = window.innerHeight;
  };

  var _push_ctx = function()
  {
    if (!_tooltip_ctxs[_ctx_stack.length])
      _tooltip_ctxs.push(new TooltipContext());

    _ctx_stack.push(_tooltip_ctxs[_ctx_stack.length]);
    _cur_ctx = _ctx_stack.last;
  }

  var _mouseover = function(event)
  {
    if (_contextmenu && _contextmenu.is_visible)
      return; 

    var ele = event.target;
    var index = _ctx_stack.length - 1;
    var ctx = null;

    for (; ctx = _ctx_stack[index]; index--)
    {
      if (ctx.tooltip_ele.contains(ele))
        break;
    }

    if (index > -1 && ctx == _ctx_stack.last)
    {
      if (ctx.current_tooltip && ctx.current_tooltip.keep_on_hover)
      {
        ctx.handle_mouse_enter(event);
        ctx.last_handler_ele = null;
        ctx.last_box = null;
        ctx.clear_show_timeout();
        ctx.clear_hide_timeout();
        _push_ctx();
      }
      else
      {
        ctx.set_hide_timeout();
        return;
      }
    }
    else
    {
      while (_ctx_stack.length > index + 1)
      {
        _ctx_stack.last.handle_mouse_leave(event);
        if (_ctx_stack.length == index + 2)
          break;
        
        else
          _ctx_stack.pop().hide_tooltip();
      }
    }

    _cur_ctx = _ctx_stack.last;

    while (ele && ele.nodeType == Node.ELEMENT_NODE)
    {      
      var name = ele.getAttribute(DATA_TOOLTIP);
      if (name && _tooltips[name]) 
      {
        if (ele == _cur_ctx.last_handler_ele)
          return;

        if (_cur_ctx.current_tooltip != _tooltips[name])
        {
          _cur_ctx.hide_tooltip();
          _cur_ctx.current_tooltip = _tooltips[name];
        }

        _cur_ctx.accept_call = true;
        _cur_ctx.last_handler_ele = ele;
        _cur_ctx.last_box = ele.getBoundingClientRect();
        _cur_ctx.last_event = event;
        _cur_ctx.set_show_timeout();
        return;
      }

      ele = ele.parentNode;
    }

    if (_cur_ctx.current_tooltip)
      _cur_ctx.accept_call = false;
    
    _cur_ctx.set_hide_timeout();
  };

  var _show_tooltip = function(tooltip, content, box)
  {
    if (_cur_ctx &&  tooltip == _cur_ctx.current_tooltip &&
        _cur_ctx.accept_call)
    {
      if (!content && _cur_ctx.last_handler_ele)
        content = _cur_ctx.last_handler_ele.getAttribute(DATA_TOOLTIP_TEXT);

      if (content)
      {
        _cur_ctx.tooltip_ele.scrollTop = 0;
        _cur_ctx.tooltip_ele.scrollLeft = 0;
        if (typeof content == "string")
          _cur_ctx.tooltip_ele.textContent = content;
        else
          _cur_ctx.tooltip_ele.clearAndRender(content);
      }

      if (!box && _cur_ctx.last_box)
      {
        box = {top: _cur_ctx.last_box.top,
               bottom: _cur_ctx.last_box.bottom,
               left: _cur_ctx.last_box.left,
               right: _cur_ctx.last_box.right};

        if (_cur_ctx.last_event)
        {
          box.mouse_x = _cur_ctx.last_event.clientX;
          box.mouse_y = _cur_ctx.last_event.clientY;
        } 
        else
        {
          box.mouse_x = Math.floor(box.left + (box.right - box.left) / 2);
          box.mouse_y = Math.floor(box.top + (box.bottom - box.top) / 2);
        }        
      }

      if (box)
      {
        var max_h = 0;
        var max_w = 0;

        _cur_ctx.select_last_handler_ele();

        if (box.bottom - box.top < _window_height / 3 ||
            Math.max(box.left, _window_width - box.right) < _window_height / 3)
        {
          // positioning horizontally
          if (_window_height - box.bottom > box.top)
          {
            var top = box.bottom + DISTANCE_Y;
            _cur_ctx.tooltip_ele.style.top = top + "px";
            _cur_ctx.tooltip_ele.style.bottom = "auto";
            max_h = _window_height - top - MARGIN_Y - _padding_height;
            _cur_ctx.tooltip_ele.style.maxHeight = max_h + "px";
          }
          else
          {
            var bottom = _window_height - box.top + DISTANCE_Y;
            _cur_ctx.tooltip_ele.style.bottom = bottom + "px";
            _cur_ctx.tooltip_ele.style.top = "auto";
            max_h = _window_height - bottom - MARGIN_Y - _padding_height;
            _cur_ctx.tooltip_ele.style.maxHeight = max_h + "px"; 
          }

          if (box.mouse_x < _window_width / 2)
          {
            var left = box.mouse_x + DISTANCE_X;
            _cur_ctx.tooltip_ele.style.left = left + "px";
            _cur_ctx.tooltip_ele.style.right = "auto";
            max_w = _window_width - left - MARGIN_X - _padding_width;
            _cur_ctx.tooltip_ele.style.maxWidth = max_w + "px"; 
          }
          else
          {
            var right = _window_width - box.mouse_x + DISTANCE_X;
            _cur_ctx.tooltip_ele.style.right = right + "px";
            _cur_ctx.tooltip_ele.style.left = "auto";
            max_w = _window_width - right - MARGIN_X - _padding_width;
            _cur_ctx.tooltip_ele.style.maxWidth = max_w + "px"; 
          }
          
        }
        else
        {
          // positioning vertically 
          if (_window_width - box.right > box.left)
          {
            var left = box.right + DISTANCE_X;
            _cur_ctx.tooltip_ele.style.left = left + "px";
            _cur_ctx.tooltip_ele.style.right = "auto";
            max_w = _window_width - left - MARGIN_X - _padding_width;
            _cur_ctx.tooltip_ele.style.maxWidth = max_w + "px"; 
          }
          else
          {
            var right = box.left - DISTANCE_X;
            _cur_ctx.tooltip_ele.style.right = right + "px";
            _cur_ctx.tooltip_ele.style.left = "auto";
            max_w = right - MARGIN_X - _padding_width;
            _cur_ctx.tooltip_ele.style.maxWidth = max_w + "px";
          }

          if (box.mouse_y < _window_height / 2)
          {
            var top = box.mouse_y + DISTANCE_Y;
            _cur_ctx.tooltip_ele.style.top = top + "px";
            _cur_ctx.tooltip_ele.style.bottom = "auto";
            max_h = _window_height - top - MARGIN_Y - _padding_height;
            _cur_ctx.tooltip_ele.style.maxHeight = max_h + "px";
          }
          else
          {
            var bottom = _window_height - box.mouse_y - DISTANCE_Y;
            _cur_ctx.tooltip_ele.style.bottom = bottom + "px";
            _cur_ctx.tooltip_ele.style.top = "auto";
            max_h = box.mouse_y - MARGIN_Y - _padding_height;
            _cur_ctx.tooltip_ele.style.maxHeight = max_h + "px";
          }
        }
      }
    }
  };

  var _hide_tooltip = function(tooltip)
  {
    if (_cur_ctx && _cur_ctx.current_tooltip && 
        tooltip == _cur_ctx.current_tooltip &&
        _cur_ctx.accept_call)
    {
      _cur_ctx.hide_tooltip(true);
    }
  };

  var _setup = function()
  {
    if ("ContextMenu" in window)
      _contextmenu = ContextMenu.get_instance();
    
    _push_ctx();
    document.addEventListener("mouseover", _mouseover, false);
    document.documentElement.addEventListener("mouseleave", _mouseover, false);
    window.addEventListener("resize", store_window_dimensions, false);
    store_window_dimensions();
    var style = document.styleSheets.getDeclaration(".tooltip-container");
    ["padding-left",
     "border-left-width",
     "padding-right",
     "border-right-width",
     "padding-top",
     "border-top-width",
     "padding-bottom",
     "border-bottom-width"].forEach(function(prop)
    {
      var value = parseInt(style.getPropertyValue(prop));
      if (value)
      {
        if (prop.contains("left") || prop.contains("right")) 
          _padding_width += value;
        else
          _padding_height += value;
      }
    });
  };

  /* implementation */

  this.register = function(name, keep_on_hover, set_selected)
  {
    if (!_is_setup)
    {
      if (document.readyState == "complete")
        _setup();
      else
        document.addEventListener("load", _setup, false);
      _is_setup = true;  
    }

    if (typeof set_selected != "boolean")
      set_selected = true;

    _tooltips[name] = new Tooltip(keep_on_hover, set_selected);
    return _tooltips[name];
  };

  this.unregister = function(name, tooltip)
  {
    if (_tooltips[name] && _tooltips[name] == tooltip)
      _tooltips[name] = null;
  };

  this.is_in_target_chain = function(event)
  {
    for (var i = 0, ctx; ctx = _ctx_stack[i]; i++)
    {
      if (ctx.tooltip_ele.contains(event.target))
        return true;
    }
    return false;
  };

  this.handle_contextmenu_event = function(event)
  {
    if (_cur_ctx && !_cur_ctx.tooltip_ele.contains(event.target))
      _cur_ctx.hide_tooltip();
  };

}).apply(Tooltips);
