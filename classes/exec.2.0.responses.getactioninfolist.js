// Autogenerated by hob
window.cls || (window.cls = {});
cls.Exec || (cls.Exec = {});
cls.Exec["2.0"] || (cls.Exec["2.0"] = {});

/** 
  * List all valid `Action` `name`s
  */
cls.Exec["2.0"].ActionInfoList = function(arr)
{
  this.actionInfoList = (arr[0] || []).map(function(item)
  {
    return new cls.Exec["2.0"].ActionInfo(item);
  });
};

/** 
  * Name of an action, to be used in the `Action` message.
  */
cls.Exec["2.0"].ActionInfo = function(arr)
{
  this.name = arr[0];
};

