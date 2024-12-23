#Build time arguments
ARG HTTP_PROXY
ARG HTTPS_PROXY 
ARG NO_PROXY

FROM jenkins/jenkins:lts

# Install additional programs required by Jenkins and handle the proxy issue.

ENV http_proxy "http://proxy.research.ge.com:80"
ENV https_proxy "http://proxy.research.ge.com:80"
ENV no_proxy "localhost,127.0.0.1,.ge.com,.build.ge.com,github.build.ge.com"

# Runtime environment variables
ENV no_proxy=$NO_PROXY
ENV http_proxy=$HTTP_PROXY
ENV https_proxy=$HTTPS_PROXY

USER root
#RUN apt update; apt install ca-certificates vim wget iputils-ping -y
# RUN apt install docker.io docker-compose -y

#COPY trust-certs/ /usr/local/share/ca-certificates/
# RUN update-ca-certificates && \
#     ls -1 /usr/local/share/ca-certificates | while read cert; do \
#         openssl x509 -outform der -in /usr/local/share/ca-certificates/$cert -out $cert.der; \
#         /java/bin/keytool -import -alias $cert -keystore /java/jre/lib/security/cacerts -trustcacerts -file $cert.der -storepass changeit -noprompt; \
#         rm $cert.der; \
#     done

# Install the latest docker version
#RUN apt install apt-transport-https curl software-properties-common -y
#RUN curl -sSL https://get.docker.com/ | sh


# In order to solve the plug-in download certificate check issue, we have to: 
# 1) use this http site instead of https
# 2) make sure to set the proxy correctly once jenkins is up. hostname: proxy.research.ge.com port: 80 (have to use the Jenkins UI for that)
ENV JENKINS_UC=http://updates.jenkins.io/update-center.json

USER jenkins

#COPY plugins.txt /usr/share/jenkins/plugins.txt
#RUN jenkins-plugin-cli --plugin-file=/usr/share/jenkins/plugins.txt

#RUN echo $JAVA_OPTS

#RUN jenkins-plugin-cli --plugins "blueocean:1.25.6 docker-workflow:1.29 skip-certificate-check:1.1"
#RUN jenkins-plugin-cli --plugins "blueocean:latest docker-workflow:latest skip-certificate-check:latest"

