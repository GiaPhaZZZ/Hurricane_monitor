FROM public.ecr.aws/lambda/python:3.10

# Install the function's dependencies using file requirements.txt
# from your project folder.
COPY requirements.txt  .
RUN pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}" --extra-index-url https://download.pytorch.org/whl/cpu

# Copy function code
COPY app.py ${LAMBDA_TASK_ROOT}

# Copy model file to subdirectory to avoid Python .pth file confusion
RUN mkdir -p ${LAMBDA_TASK_ROOT}/models
COPY cropping_storm_7304_2l.pth ${LAMBDA_TASK_ROOT}/models/

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "app.handler" ]
