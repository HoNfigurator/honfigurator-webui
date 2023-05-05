import React, { useState } from 'react';
import { Modal, Form, Input, notification, Row, Col } from 'antd';
import { axiosInstanceUI } from '../Security/axiosRequestFormat';
import { performTCPCheck } from '../Helpers/healthChecks';
import { errorMessage, WarningMessageDenied, WarningMessageTCP } from './Messages';

const AddServerModal = ({ visible, setVisible, onServerAdded }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleCancel = () => {
    form.resetFields();
    setVisible(false);
  };

  const handleOk = async () => {
    setLoading(true);
    const values = await form.validateFields();
    const tcpCheckStatusResponse = await performTCPCheck(values.serverAddress, values.serverPort);
    // console.log(tcpCheckStatusResponse);

    if (tcpCheckStatusResponse.status === 200) {
      addServer(values);
    } else if (tcpCheckStatusResponse.status === 500) {
      Modal.warning({
        title: 'Warning',
        content: <WarningMessageTCP port={values.serverPort || 5000} />,
        okText: 'Okay',
        onOk: () => {
          setLoading(false);
        }
      });
    } else if (tcpCheckStatusResponse.status === 401 || tcpCheckStatusResponse.status === 403) {
      Modal.warning({
        title: 'Warning',
        content: <WarningMessageDenied />,
        okText: 'Okay',
        onOk: () => {
          setLoading(false);
        }
      });
      form.resetFields();
    } else {
      notification.error({
        message: 'Error',
        description: <>{errorMessage(tcpCheckStatusResponse)}</>,
      });
      form.resetFields();
    }
    setLoading(false);
  };

  const addServer = async (values) => {
    try {
      const payload = {
        name: values.serverName,
        address: values.serverAddress,
        port: values.port
      }
      const response = await axiosInstanceUI.post('/user/add_server', payload);

      if (!response.status === 200) {
        throw new Error(`Error: ${response.statusText}`);
      }

      notification.success({
        message: 'Success',
        description: 'Server added successfully!',
      });
      form.resetFields();
      setVisible(false);

      // Pass the added server's information to the callback
      onServerAdded({
        label: payload.name,
        value: payload.address,
        port: payload.port
      });

    } catch (error) {
      notification.error({
        message: 'Error',
        description: <>{errorMessage(error)}</>,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Server" visible={visible} onOk={handleOk} onCancel={handleCancel} confirmLoading={loading}>
      <Form form={form} layout="vertical">
        <Form.Item label="Server Name" name="serverName" rules={[{ required: true, message: 'Please input the server name!' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Server Address" required>
          <Row gutter={8}>
            <Col span={18}>
              <Form.Item name="serverAddress" rules={[{ required: true, message: 'Please input the server address!' }]}>
                <Input style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="serverPort" noStyle>
                <Input
                  addonBefore="Port"
                  type="number"
                  min={0}
                  max={65535}
                  defaultValue={5000}
                  placeholder="Port (default: 5000)"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddServerModal;
