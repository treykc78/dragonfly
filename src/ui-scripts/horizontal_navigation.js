﻿/**
 * @constructor
 * @extends UIBase
 */
var HorizontalNavigation = function(cell)
{
  this.type = 'horizontal-navigation';

  var lastDir = null;

  this.setContent = function(template_list, focus_end)
  {
    this.breadcrumbs.clearAndRender(template_list);
    this.checkWidth();
    if (focus_end)
    {
      // TODO: make sure the animation doesn't happen here
      this.breadcrumbs.scrollLeft = this.breadcrumbs.scrollWidth;
    }
  };

  this.nav = function(dir)
  {
      var left = 0;
      var breadcrumbsDim = this.breadcrumbs.getBoundingClientRect();
      var element = this.currentBreadcrumbEl;

      if (lastDir != dir) element = null;
      lastDir = dir;

      if (dir == "back")
      {
          if (!element)
          {
              element = this.breadcrumbs.querySelectorAll("breadcrumb")[0];
              while (element && element.getBoundingClientRect().right < this.nav_back.offsetWidth) {
                  element = element.nextElementSibling;
              }
          }

          if (element)
          {
              var leftEdge = element.getBoundingClientRect().left;
              left = this.nav_back.getBoundingClientRect().right - leftEdge;
              element = element.previousElementSibling;
          }
      }
      else
      {
          if (!element)
          {
              element = this.breadcrumbs.querySelectorAll("breadcrumb")[0];
              while (element && element.getBoundingClientRect().right - 1 <= this.nav_forward.offsetLeft) {
                  element = element.nextElementSibling;
              }
          }

          if (element)
          {
              var rightEdge = element.getBoundingClientRect().right - breadcrumbsDim.left; //element.offsetLeft + element.offsetWidth;
              left = breadcrumbsDim.width - rightEdge;
              element = element.nextElementSibling;
          }
      }

      var pos = parseInt(getComputedStyle(this.breadcrumbs, null).getPropertyValue("left"));
      this.breadcrumbs.style.OTransitionDuration = Math.min(Math.abs(left) / 200, .2) + "s";
      this.breadcrumbs.style.left = pos + left + "px";
  };

  this.checkWidth = function()
  {
      this.currentBreadcrumbEl = null;
      if (this.breadcrumbs.scrollWidth > this.breadcrumbs.offsetWidth) // TODO: seems to be a bit off, should be tweaked
      {
          this.element.addClass("navs");
      }
      else
      {
          this.element.removeClass("navs");
          this.breadcrumbs.style.removeProperty("left");
      }
  };

  this.init = function(cell)
  {
    this.cell = cell;
    this.initBase();

    this.element = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
    this.breadcrumbs = document.createElement("breadcrumbs");
    this.breadcrumbs.setAttribute("handler", "breadcrumbs-drag");
    this.breadcrumbs.setAttribute("data-model-id", "dom-inspection-id-1"); // should not be hard-coded I guess
    this.nav_back = document.createElement("nav");
    this.nav_back.textContent = "◀";
    this.nav_back.setAttribute("dir", "back");
    this.nav_back.setAttribute("handler", "horizontal-nav");
    this.nav_forward = document.createElement("nav");
    this.nav_forward.setAttribute("dir", "forward");
    this.nav_forward.setAttribute("handler", "horizontal-nav");
    this.nav_forward.textContent = "▶";
    this.element.appendChild(this.nav_back);
    this.element.appendChild(this.breadcrumbs);
    this.element.appendChild(this.nav_forward);
    this.currentBreadcrumbEl = null;

    window.addEventListener("resize", this.checkWidth.bind(this), false);
  };

  this.init(cell);
};

HorizontalNavigation.prototype = UIBase;

