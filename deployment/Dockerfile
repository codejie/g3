FROM --platform=linux/arm64 centos:8

RUN sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-* && \
    sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*

RUN mkdir -p /data /workspace
VOLUME ["/data", "/workspace"]

EXPOSE 10089 10090 10091

WORKDIR /workspace

CMD ["sh", "-c", "tail -f /dev/null"]
