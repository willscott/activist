Activist.js
===========

Web Documentation at activistjs.com.

Installation
------------

1. Copy the 4 files to your web server.
2. Include 'activist.js' as a script tag on pages you wish to activate.

    ```html
    <script type='text/javascript' src='/activist.js'></script>
    ```

Customization
-------------

The contents of the file 'activist-offline.html' may be show when a user
visits your website when they are offline, or when your site is down. You may
customize it as appropriate. Any resources included in it should be added to
activist.appcache, so that they are also cached on the client.

To customize the display when interference is detected, you should reconfigure
the activist.js script, either interactively at activistjs.com, or by
building it yourself from the github source.
