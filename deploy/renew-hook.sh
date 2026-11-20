#!/bin/sh
case " $RENEWED_DOMAINS " in
  *" fdeclub.net "*) /usr/sbin/nginx -t && /usr/bin/systemctl reload nginx ;;
esac
