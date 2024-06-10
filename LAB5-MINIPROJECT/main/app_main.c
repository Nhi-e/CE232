
/* MQTT over SSL Example

   This example code is in the Public Domain (or CC0 licensed, at your option.)

   Unless required by applicable law or agreed to in writing, this
   software is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
   CONDITIONS OF ANY KIND, either express or implied.
*/

#include <stdio.h>
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include "esp_system.h"
#include "esp_timer.h"
#include "esp_wifi.h"
#include "esp_partition.h"
#include "nvs_flash.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "protocol_examples_common.h"
#include "driver/gpio.h"
#include "esp_log.h"
#include "mqtt_client.h"
#include "esp_tls.h"
#include "esp_ota_ops.h"
#include <sys/param.h>
#include "dht11.h"
#include "nvs.h"
#include "cJSON.h"
#include "driver/i2c.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "freertos/semphr.h"
#include "freertos/queue.h"

#include "SSD1306.h"
#include "font.h"

#define _I2C_NUMBER(num) I2C_NUM_##num
#define I2C_NUMBER(num) _I2C_NUMBER(num)

#define DATA_LENGTH 512                  /*!< Data buffer length of test buffer */
#define RW_TEST_LENGTH 128               /*!< Data length for r/w test, [0,DATA_LENGTH] */
#define DELAY_TIME_BETWEEN_ITEMS_MS 1000 /*!< delay time between different test items */

#define I2C_MASTER_SCL_IO GPIO_NUM_22 /*!< gpio number for I2C master clock */
#define I2C_MASTER_SDA_IO GPIO_NUM_21 /*!< gpio number for I2C master data  */
#define I2C_MASTER_NUM I2C_NUMBER(0)  /*!< I2C port number for master dev */
#define I2C_MASTER_FREQ_HZ 100000     /*!< I2C master clock frequency */
#define I2C_MASTER_TX_BUF_DISABLE 0   /*!< I2C master doesn't need buffer */
#define I2C_MASTER_RX_BUF_DISABLE 0   /*!< I2C master doesn't need buffer */

#define WRITE_BIT I2C_MASTER_WRITE /*!< I2C master write */
#define READ_BIT I2C_MASTER_READ   /*!< I2C master read */
#define ACK_CHECK_EN 0x1           /*!< I2C master will check ack from slave*/
#define ACK_CHECK_DIS 0x0          /*!< I2C master will not check ack from slave */
#define ACK_VAL 0x0                /*!< I2C ack value */
#define NACK_VAL 0x1               /*!< I2C nack value */

#define DHT11_PIN (GPIO_NUM_4)
static const char *TAG = "mqtts_example";
static const char *TAG2 = "MQTT_EXAMPLE";
#define MQTT_BROKER "mqtts://c0116143ef0143149b4c43981ffead03.s1.eu.hivemq.cloud"
static const char username[] = "CE232";
static const char password[] = "Nhi09032003";
bool mqtt_connect_status = false;
unsigned long LastSendMQTT = 0; 


#define MQTT_sizeoff 200

char MQTT_BUFFER[MQTT_sizeoff];
char Str_ND[MQTT_sizeoff];
char Str_DA[MQTT_sizeoff] ;
char strtemp[50];
char strhum[50];
char *topic_pub = "smarthome/sensor";
void mqtt_start(void *arg);
void MQTT_DataJson(void);
static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data);
void delay(uint32_t time);
cJSON *str_jsonMQTT,*str_jsonLora;

#define ESP_ERR (__STATUX__) if ()
SemaphoreHandle_t print_mux = NULL;
static const char *TAG3 = "OLED";

void ssd1306_init();
void LCD();
void task_ssd1306_display_text(const void *arg_text, uint8_t _page, uint8_t _seg);
void task_ssd1306_display_clear();
esp_err_t task_ssd1306_display_location(uint8_t _page, uint8_t _seg);
esp_err_t task_ssd1306_display_image(uint8_t *images, uint8_t _page, uint8_t _seg, int _size);

#if CONFIG_BROKER_CERTIFICATE_OVERRIDDEN == 1
static const uint8_t mqtt_eclipseprojects_io_pem_start[]  = "-----BEGIN CERTIFICATE-----\n" CONFIG_BROKER_CERTIFICATE_OVERRIDE "\n-----END CERTIFICATE-----";
#else
extern const uint8_t mqtt_eclipseprojects_io_pem_start[]   asm("_binary_mqtt_eclipseprojects_io_pem_start");
#endif
extern const uint8_t mqtt_eclipseprojects_io_pem_end[]   asm("_binary_mqtt_eclipseprojects_io_pem_end");

static void send_binary(esp_mqtt_client_handle_t client)
{
    esp_partition_mmap_handle_t out_handle;
    const void *binary_address;
    const esp_partition_t *partition = esp_ota_get_running_partition();
    esp_partition_mmap(partition, 0, partition->size, ESP_PARTITION_MMAP_DATA, &binary_address, &out_handle);
    // sending only the configured portion of the partition (if it's less than the partition size)
    int binary_size = MIN(CONFIG_BROKER_BIN_SIZE_TO_SEND, partition->size);
    int msg_id = esp_mqtt_client_publish(client, "/topic/binary", binary_address, binary_size, 0, 0);
    ESP_LOGI(TAG, "binary sent with msg_id=%d", msg_id);
}
static esp_err_t __attribute__((unused)) i2c_master_read_slave(i2c_port_t i2c_num, uint8_t *data_rd, size_t size)
{
    if (size == 0)
    {
        return ESP_OK;
    }
    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (OLED_I2C_ADDRESS << 1) | READ_BIT, ACK_CHECK_EN);
    if (size > 1)
    {
        i2c_master_read(cmd, data_rd, size - 1, ACK_VAL);
    }
    i2c_master_read_byte(cmd, data_rd + size - 1, NACK_VAL);
    i2c_master_stop(cmd);
    esp_err_t ret = i2c_master_cmd_begin(i2c_num, cmd, 1000 / portTICK_PERIOD_MS);
    i2c_cmd_link_delete(cmd);
    return ret;
}
static esp_err_t __attribute__((unused)) i2c_master_write_slave(i2c_port_t i2c_num, uint8_t *data_wr, size_t size)
{
    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (OLED_I2C_ADDRESS << 1) | WRITE_BIT, ACK_CHECK_EN);
    i2c_master_write(cmd, data_wr, size, ACK_CHECK_EN);
    i2c_master_stop(cmd);
    esp_err_t ret = i2c_master_cmd_begin(i2c_num, cmd, 1000 /portTICK_PERIOD_MS);
    i2c_cmd_link_delete(cmd);
    return ret;
}
static esp_err_t i2c_master_init(void)
{
    int i2c_master_port = I2C_MASTER_NUM;
    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = I2C_MASTER_SDA_IO,
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_io_num = I2C_MASTER_SCL_IO,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master.clk_speed = I2C_MASTER_FREQ_HZ,
        // .clk_flags = 0,          /*!< Optional, you can use I2C_SCLK_SRC_FLAG_* flags to choose i2c source clock here. */
    };
    esp_err_t err = i2c_param_config(i2c_master_port, &conf);
    if (err != ESP_OK)
    {
        return err;
    }
    return i2c_driver_install(i2c_master_port, conf.mode, I2C_MASTER_RX_BUF_DISABLE, I2C_MASTER_TX_BUF_DISABLE, 0);
}

static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data)
{
    ESP_LOGD(TAG, "Event dispatched from event loop base=%s, event_id=%" PRIi32, base, event_id);
    esp_mqtt_event_handle_t event = event_data;
    esp_mqtt_client_handle_t client = event->client;
    int msg_id;
    switch ((esp_mqtt_event_id_t)event_id) {
    case MQTT_EVENT_CONNECTED:
        mqtt_connect_status = true;
        ESP_LOGI(TAG, "MQTT_EVENT_CONNECTED");
        msg_id = esp_mqtt_client_subscribe(client, "/topic/qos0", 0);
        ESP_LOGI(TAG, "sent subscribe successful, msg_id=%d", msg_id);

        msg_id = esp_mqtt_client_subscribe(client, "/topic/qos1", 1);
        ESP_LOGI(TAG, "sent subscribe successful, msg_id=%d", msg_id);

        msg_id = esp_mqtt_client_unsubscribe(client, "/topic/qos1");
        ESP_LOGI(TAG, "sent unsubscribe successful, msg_id=%d", msg_id);
        break;
    case MQTT_EVENT_DISCONNECTED:
        ESP_LOGI(TAG, "MQTT_EVENT_DISCONNECTED");
        break;

    case MQTT_EVENT_SUBSCRIBED:
        ESP_LOGI(TAG, "MQTT_EVENT_SUBSCRIBED, msg_id=%d", event->msg_id);
        msg_id = esp_mqtt_client_publish(client, "/topic/qos0", "data", 0, 0, 0);
        ESP_LOGI(TAG, "sent publish successful, msg_id=%d", msg_id);
        break;
    case MQTT_EVENT_UNSUBSCRIBED:
        ESP_LOGI(TAG, "MQTT_EVENT_UNSUBSCRIBED, msg_id=%d", event->msg_id);
        break;
    case MQTT_EVENT_PUBLISHED:
        ESP_LOGI(TAG, "MQTT_EVENT_PUBLISHED, msg_id=%d", event->msg_id);
        break;
    case MQTT_EVENT_DATA:
        ESP_LOGI(TAG, "MQTT_EVENT_DATA");
        printf("TOPIC=%.*s\r\n", event->topic_len, event->topic);
        printf("DATA=%.*s\r\n", event->data_len, event->data);
        if (strncmp(event->data, "send binary please", event->data_len) == 0) {
            ESP_LOGI(TAG, "Sending the binary");
            send_binary(client);
        }
        break;
    case MQTT_EVENT_ERROR:
        ESP_LOGI(TAG, "MQTT_EVENT_ERROR");
        break;
    default:
        ESP_LOGI(TAG, "Other event id:%d", event->event_id);
        break;
    }
}

void app_main(void)
{
    ESP_LOGI(TAG, "[APP] Startup..");
    ESP_LOGI(TAG, "[APP] Free memory: %" PRIu32 " bytes", esp_get_free_heap_size());
    ESP_LOGI(TAG, "[APP] IDF version: %s", esp_get_idf_version());

    esp_log_level_set("*", ESP_LOG_INFO);
    esp_log_level_set("esp-tls", ESP_LOG_VERBOSE);
    esp_log_level_set("mqtt_client", ESP_LOG_VERBOSE);
    esp_log_level_set("mqtt_example", ESP_LOG_VERBOSE);
    esp_log_level_set("transport_base", ESP_LOG_VERBOSE);
    esp_log_level_set("transport", ESP_LOG_VERBOSE);
    esp_log_level_set("outbox", ESP_LOG_VERBOSE);

    ESP_ERROR_CHECK(nvs_flash_init());
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    ESP_ERROR_CHECK(example_connect());

    print_mux = xSemaphoreCreateMutex();
    ESP_ERROR_CHECK(i2c_master_init());
    ssd1306_init();
    DHT11_init(DHT11_PIN);
    delay(50);
    xTaskCreate(mqtt_start, "Task", 4096, NULL, 5, NULL);
    
}

void mqtt_start(void *handler_args)
{
    
    const esp_mqtt_client_config_t mqtt_cfg = {
        .broker =
        {
            .address.uri = MQTT_BROKER,
            .verification.certificate = (const char *)mqtt_eclipseprojects_io_pem_start
        },
        .credentials = 
        {
            .username = username,
            .authentication.password = password,
        }
    };

    esp_mqtt_client_handle_t client = esp_mqtt_client_init(&mqtt_cfg);
    /* The last argument may be used to pass data to the event handler, in this example mqtt_event_handler */
    esp_mqtt_client_register_event(client, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL);
    esp_mqtt_client_start(client);
    LastSendMQTT = esp_timer_get_time()/1000;
    
    while(1)
	{
		if(esp_timer_get_time()/1000 - LastSendMQTT >= 1500)
		{
			if(mqtt_connect_status && DHT11_read().humidity > 0)
			{
                char str[500];
                task_ssd1306_display_clear();
	            sprintf (strtemp, "nhiet do: %d", DHT11_read().temperature);
                task_ssd1306_display_text(strtemp, 2, 32);
                sprintf (strhum, "do am: %d", DHT11_read().humidity);
                task_ssd1306_display_text(strhum, 4, 32);
                delay(50);
				MQTT_DataJson();
				esp_mqtt_client_publish(client, topic_pub, MQTT_BUFFER, 0, 1, 0);
				ESP_LOGI(TAG2, "SEND MQTT %s", MQTT_BUFFER);
				delay(10000);		
				taskYIELD();
			}
			
			LastSendMQTT = esp_timer_get_time()/1000;
		}
		
		delay(50);
	}
	vTaskDelete(NULL);
}
void MQTT_DataJson(void)
{
	for(int i = 0 ; i < MQTT_sizeoff ; i++)
	{
		
		MQTT_BUFFER[i] = 0;	
		Str_ND[i] = 0;
		Str_DA[i] = 0;
	}

    sprintf(Str_ND, "%d", DHT11_read().temperature);
    sprintf(Str_DA, "%d", DHT11_read().humidity);

	strcat(MQTT_BUFFER,"{\"Temperature\":\"");
	strcat(MQTT_BUFFER,Str_ND);
	strcat(MQTT_BUFFER,"\",");
	
	
	strcat(MQTT_BUFFER,"\"Humidity\":\"");
	strcat(MQTT_BUFFER,Str_DA);
	strcat(MQTT_BUFFER,"\"}");

}
void delay(uint32_t time)
{
	vTaskDelay(time / portTICK_PERIOD_MS);
}

void ssd1306_init()
{
    esp_err_t espRc;

    i2c_cmd_handle_t cmd = i2c_cmd_link_create();

    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (OLED_I2C_ADDRESS << 1) | I2C_MASTER_WRITE, true);
    i2c_master_write_byte(cmd, OLED_CONTROL_BYTE_CMD_STREAM, true);

    i2c_master_write_byte(cmd, OLED_CMD_SET_MEMORY_ADDR_MODE, true);
    i2c_master_write_byte(cmd, OLED_CMD_SET_PAGE_ADDR_MODE, true);
    // set lower and upper column register address 0b upper = 0000, lower 0000,
    i2c_master_write_byte(cmd, 0x00, true);
    i2c_master_write_byte(cmd, 0x10, true);

    i2c_master_write_byte(cmd, OLED_CMD_SET_CHARGE_PUMP, true);
    i2c_master_write_byte(cmd, 0x14, true);

    i2c_master_write_byte(cmd, OLED_CMD_SET_SEGMENT_REMAP_1, true); // reverse left-right mapping
    i2c_master_write_byte(cmd, OLED_CMD_SET_COM_SCAN_MODE_0, true); // reverse up-bottom mapping

    i2c_master_write_byte(cmd, OLED_CMD_DISPLAY_OFF, true);
    i2c_master_write_byte(cmd, OLED_CMD_DEACTIVE_SCROLL, true); // 2E
    i2c_master_write_byte(cmd, OLED_CMD_DISPLAY_NORMAL, true);  // A6
    i2c_master_write_byte(cmd, OLED_CMD_DISPLAY_ON, true);      // AF

    i2c_master_stop(cmd);

    espRc = i2c_master_cmd_begin(I2C_NUM_0, cmd, 10 / portTICK_PERIOD_MS);
    if (espRc == ESP_OK)
    {
        ESP_LOGI(TAG3, "OLED configured successfully");
    }
    else
    {
        ESP_LOGE(TAG3, "OLED configuration failed. code: 0x%.2X", espRc);
    }
    i2c_cmd_link_delete(cmd);
    return;
}

void task_ssd1306_display_text(const void *arg_text, uint8_t _page, uint8_t _seg)
{
    char *text = (char *)arg_text;
    uint8_t text_len = strlen(text);

    uint8_t image[8];

    if (task_ssd1306_display_location(_page, _seg) == ESP_OK)
    {
        for (uint8_t i = 0; i < text_len; i++)
        {
            memcpy(image,font8x8_basic_tr[(uint8_t)text[i]],8);
            task_ssd1306_display_image(image, _page, _seg,sizeof(image));
            _seg = _seg + 8;
        }
    }
    return;
}
esp_err_t task_ssd1306_display_location(uint8_t _page, uint8_t _seg)
{
    i2c_cmd_handle_t cmd;

    esp_err_t status = 0;

    uint8_t lowColumnSeg = _seg & 0x0F;
    uint8_t highColumnSeg = (_seg >> 4) & 0x0F;

    cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (OLED_I2C_ADDRESS << 1) | I2C_MASTER_WRITE, true);

    i2c_master_write_byte(cmd, OLED_CONTROL_BYTE_CMD_STREAM, true);
    i2c_master_write_byte(cmd, 0x00 | lowColumnSeg, true);  // reset column - choose column --> 0
    i2c_master_write_byte(cmd, 0x10 | highColumnSeg, true); // reset line - choose line --> 0
    i2c_master_write_byte(cmd, 0xB0 | _page, true);         // reset page

    i2c_master_stop(cmd);
    
    status = i2c_master_cmd_begin(I2C_NUM_0, cmd, 10 / portTICK_PERIOD_MS);
    if (status == ESP_OK)
    {
        
        return status;
    }
    else
    {
        
        ESP_LOGI(TAG3, "ERROR Code : %d ", status);
    }
    i2c_cmd_link_delete(cmd);
    return status;
}
esp_err_t task_ssd1306_display_image(uint8_t *images, uint8_t _page, uint8_t _seg, int _size)
{
    // ESP_LOGI(TAG, "Size : %d" , _size);
    esp_err_t status = 0;

    i2c_cmd_handle_t cmd;
    
    if (task_ssd1306_display_location(_page, _seg) == ESP_OK)
    {
        cmd = i2c_cmd_link_create();
        i2c_master_start(cmd);
        i2c_master_write_byte(cmd, (OLED_I2C_ADDRESS << 1) | I2C_MASTER_WRITE, true);

        i2c_master_write_byte(cmd, OLED_CONTROL_BYTE_DATA_STREAM, true);
        i2c_master_write(cmd, images , _size, true);

        i2c_master_stop(cmd);
        status = i2c_master_cmd_begin(I2C_NUM_0, cmd, 10 / portTICK_PERIOD_MS);
        i2c_cmd_link_delete(cmd);

    }
    return status;
}
void task_ssd1306_display_clear()
{
    esp_err_t status ;

    uint8_t clear[128];
    for (uint8_t i = 0; i < 128; i++)
    {
        clear[i] = 0x00;
    }

    for (uint8_t _page = 0; _page < 8; _page++)
    {
        status = task_ssd1306_display_image(clear, _page , 0x00 , sizeof(clear));  
    }
    return;
}
