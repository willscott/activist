Activist.js
===========

Additional Documentation is available at https://activistjs.com.

This version of Activist.js was built at %%DATE%%.

Installation
------------

1. Copy the included files to your web server.
2. Include 'activist.js' as a script tag on pages you wish to activate.

    ```html
    <script type='text/javascript' src='/activist.js'></script>
    ```

Customization
-------------

The contents of the file 'activist-offline.html' will be show when a user
visits your website when they are offline, or when your site is down. You can
customize it to match your site's theme as appropriate. Any resources used on
the page (stylesheets, images), should be added to activist.appcache, so that
they are cached on the client.

NOTE: once cached, resources will not be updated by clients. To trigger an
update, you should update the timestamp in the 'activist.appcache' file.

To customize the display when interference is detected, you should reconfigure
the activist.js script, either interactively at activistjs.com, or by
building it yourself with your desired message.
