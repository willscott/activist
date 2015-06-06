activist.js
===========

activist.js is a standalone library for making your site resilient to unexpected
network events.

Activist comes in 2 versions, which offer a trade-off between how much work you
need to do to add the library to your site, and how many of your users will be
able to take advantage of the work.  New browsers provide features that make
the installation of activist.js as simple as adding a script tag to your home
page, however this version of the library will only work for a small percentage
of your user base (up-to-date chrome users). Activist also is packaged with a
drop-in application cache manifst, which will extend the benefit to most users,
but can require wider site changes.

Deploying
---------

1. Add `activist.js` to your site.

    ```html
    <script type='text/javascript' src='activist.js' async></script>
    ```

2. Add Offline Cache (recommended)

    Adding an application cache manifest will allow activist.js to run on most
    browsers, and is strongly recommended. Adding this cache is a 2 step
    process. First, modify the ```html``` tag of your pages to reference
    the cache. It should look something like this:
    
    ```html
    <html manifest="/activist.appcache">
    ```
    
    A sample appcache is available on [activistjs.com](http://activistjs.com).
    
    The application cache needs to be served with the mime type of
    'text/cache-manifest' to work on old versions of internet explorer.

    More information on application cache mechanics are available on the
    [w3 website](http://www.whatwg.org/specs/web-apps/current-work/multipage/offline.html).

How?
----

Activist tries really hard to keep your content accessible in the face of
adversity.  In practice this results in several independent processes that kick
into action when your server is unavailable.

The first line of access is to preserve a reasonable cache of your site to
allow users to see existing content even if they can't get new updates.  To
this end, Activist maintains a cache of your content on client machines and
shows that content when needed.

To retreive updates, Activist attempts to establish connectivity through CDNs
and other rendezvous services. These rendezvous services update while Activist
is online, and aim to force interference with a large quantity of content to
successfully disrupt.

Contributing
------------

Contribution and help are welcome! activist.js development is centered on
github, and open tasks can be found in the issues area of this repository.

![A](https://quimian.com/a.png)
