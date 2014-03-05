activist.js
===========

activist.js is a [freedom.js](http://freedomjs.com) application for loading
content through peers when a server is unavailable.

Activist comes in 2 versions, which offer a trade-off between how much work you
need to do to add the library to your site, and how many of your users will be
able to take advantage of activist.js.  New browsers provide features that make
the installation of activist.js as simple as adding a script tag to your home
page, however this version of the library will only work for a small percentage
of your user base. If you are willing to use activist in addition to an app
cache, it will be able to help a much larger fraction of your user base, but
requires additional changes to your site.

Deploying
---------

1. Add activist.js

    ```html
    <script type='text/javascript' src='activist.js' async></script>
    ```


2. Add Offline Cache (recommended)

    Adding an application cache manifest will allow activist.js to run on many
    more browsers, and is strongly recommended. Adding this cache is a 2 step
    process. First, modify the ```html``` tag of your entry pages to reference
    the cache. It should look something like this:
    
    ```html
    <html manifest="/activist.appcache">
    ```
    
    Sample appcaches are provided in the documentation of this repository.
    The following is a minimal configuration for activating your hope page:
    
    ```
    CACHE MANIFEST
    /
    /activist.js
    ```
    
    Note that the application cache should be served with the mime type
    of 'text/cache-manifest'. More information on the application cache
    mechanics are available on the [w3 website](http://www.whatwg.org/specs/web-apps/current-work/multipage/offline.html).

Contributing
------------

Contribution and help are welcome! activist.js development is centered on
github, and open tasks can be found in the issues area of this repository.
