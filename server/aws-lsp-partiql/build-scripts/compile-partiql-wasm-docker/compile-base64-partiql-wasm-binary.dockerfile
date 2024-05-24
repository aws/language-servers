FROM amazonlinux:2023
WORKDIR /dir
### Add Rust bin path to PATH var.
ENV PATH="${PATH}:/root/.cargo/bin"
### Install system dependencies & node
RUN yum update -y && \
    yum install tar gzip -y && \
    yum install git -y && \
    yum install gcc gcc-c++ make -y && \
    yum install nodejs -y
### Install node dependencies required to run the scripts
RUN npm install zx && \
    npm -g install tsx
### Copy the scripts from the host to the container
COPY . /dir
### Run the scripts
RUN tsx compile-partiql-wasm-binary.mts && \
    tsx base64-encode-partiql-binary.mts
