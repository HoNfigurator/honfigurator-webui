import React, { useState } from 'react';
import { Modal, Form, Input, notification } from 'antd';
import { axiosInstanceUI } from '../Security/axiosRequestFormat';
import { performTCPCheck } from '../Helpers/healthChecks';

const AddServerModal = ({ visible, setVisible, onServerAdded }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const WarningMessage = () => (
    <>
      <p>The server could not be contacted over port 5000.</p>
      <p>Please ensure the following:</p>
      <ul>
        <li>HoNfigurator API is running</li>
        <li>Firewall is not blocking</li>
        <li>Network router is forwarding ports</li>
      </ul>
      <p>Do you want to proceed anyway?</p>
    </>
  );

  const errorMessage = (error) => (
    <>
      <p>Failed to add the server.</p>
      <p>{error.message}</p>
      {error.response && error.response.data && (
        <p>
          {error.response.data.error}: {error.response.data.message}
        </p>
      )}
    </>
  );

  const handleCancel = () => {
    form.resetFields();
    setVisible(false);
  };

  const handleOk = async () => {
    setLoading(true);
    const values = await form.validateFields();
    const tcpCheckStatus = await performTCPCheck(values.serverAddress);

    if (tcpCheckStatus !== 'OK') {
      Modal.confirm({
        title: 'Warning',
        content: <WarningMessage />,
        okText: 'Yes',
        cancelText: 'No',
        onOk: () => {
          addServer(values);
        },
        onCancel: () => {
          setLoading(false);
        },
      });
      
    } else {
      addServer(values);
    }
  };

  const addServer = async (values) => {
    try {
      const payload = {
        name: values.serverName,
        address: values.serverAddress
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
        value: payload.address
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
        <Form.Item label="Server Address" name="serverAddress" rules={[{ required: true, message: 'Please input the server address!' }]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddServerModal;
